import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "../db";
import { sessionTable, userTable } from "../db/schema";

const dataDir = path.join(process.cwd(), "data");
const initialAdminPasswordFilePath = path.join(dataDir, "initial-admin-password.txt");

const scryptKeyLength = 64;
const sessionTokenBytes = 32;
const sessionDurationMs = 30 * 24 * 60 * 60 * 1000;
// Alfabeto senza caratteri ambigui (0/O, 1/l/I, ecc.) per password leggibili a schermo.
const generatedPasswordAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const generatedPasswordLength = 16;
const loginRateLimitWindowMs = 15 * 60 * 1000;
const loginRateLimitMaxAttempts = 10;

export class AuthManagerError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

export type PublicUser = {
    id: number;
    username: string;
    createdAt: string;
    mustChangePassword: boolean;
    active: boolean;
    isAdmin: boolean;
};

const hashPassword = (password: string): Promise<string> =>
    new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString("hex");
        crypto.scrypt(password, salt, scryptKeyLength, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(`${salt}:${derivedKey.toString("hex")}`);
        });
    });

const verifyPassword = (password: string, storedHash: string): Promise<boolean> =>
    new Promise((resolve, reject) => {
        const [salt, hashHex] = storedHash.split(":");
        if (!salt || !hashHex) {
            resolve(false);
            return;
        }

        crypto.scrypt(password, salt, scryptKeyLength, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }
            const expected = Buffer.from(hashHex, "hex");
            resolve(expected.length === derivedKey.length && crypto.timingSafeEqual(expected, derivedKey));
        });
    });

const generateRandomPassword = (length = generatedPasswordLength): string => {
    const bytes = crypto.randomBytes(length);
    let password = "";
    for (let i = 0; i < length; i += 1) {
        password += generatedPasswordAlphabet[bytes[i] % generatedPasswordAlphabet.length];
    }
    return password;
};

const generateSessionToken = () => crypto.randomBytes(sessionTokenBytes).toString("hex");

// Hash "esca" usato quando lo username non esiste, per far girare comunque scrypt e non
// rivelare quali username esistono tramite il tempo di risposta del login.
let cachedDummyPasswordHash: Promise<string> | null = null;
const getDummyPasswordHash = (): Promise<string> => {
    if (!cachedDummyPasswordHash) {
        cachedDummyPasswordHash = hashPassword(crypto.randomBytes(32).toString("hex"));
    }
    return cachedDummyPasswordHash;
};

const toPublicUser = (
    user: {
        id: number;
        username: string;
        created_at: Date;
        mustChangePassword: boolean;
        active: boolean;
    },
    isAdmin: boolean
): PublicUser => ({
    id: user.id,
    username: user.username,
    createdAt: user.created_at.toISOString(),
    mustChangePassword: user.mustChangePassword,
    active: user.active,
    isAdmin,
});

// L'admin è semplicemente il primo account mai registrato (id più basso): non esiste
// un campo "ruolo" separato da mantenere sincronizzato.
const getAdminUserId = async (): Promise<number | null> => {
    const rows = await db.select({ id: userTable.id }).from(userTable).orderBy(asc(userTable.id)).limit(1);
    return rows[0]?.id ?? null;
};

export const ensureDefaultAdmin = async (): Promise<void> => {
    const existing = await db.select({ id: userTable.id }).from(userTable).limit(1);
    if (existing.length > 0) {
        return;
    }

    const password = generateRandomPassword();
    const passwordHash = await hashPassword(password);
    await db.insert(userTable).values({ username: "admin", passwordHash, mustChangePassword: true });

    console.log(
        [
            "============================================================",
            "Utente amministratore creato automaticamente al primo avvio:",
            "  nome utente: admin",
            `  password:    ${password}`,
            "Questa password non verrà mostrata di nuovo: cambiala dopo il primo accesso.",
            "============================================================",
        ].join("\n")
    );

    try {
        await fs.promises.mkdir(dataDir, { recursive: true });
        await fs.promises.writeFile(
            initialAdminPasswordFilePath,
            `username: admin\npassword: ${password}\n`,
            { encoding: "utf-8", mode: 0o600 }
        );
    } catch (error) {
        console.error("Impossibile scrivere il file con la password admin iniziale:", error);
    }
};

const loginAttemptsByIp = new Map<string, { count: number; resetAt: number }>();

const assertLoginRateLimit = (ip: string): void => {
    const now = Date.now();
    const entry = loginAttemptsByIp.get(ip);

    if (entry && entry.resetAt > now && entry.count >= loginRateLimitMaxAttempts) {
        throw new AuthManagerError("Troppi tentativi di accesso falliti. Riprova più tardi.", 429);
    }
};

const registerFailedLogin = (ip: string): void => {
    const now = Date.now();
    const entry = loginAttemptsByIp.get(ip);

    if (!entry || entry.resetAt <= now) {
        loginAttemptsByIp.set(ip, { count: 1, resetAt: now + loginRateLimitWindowMs });
        return;
    }

    entry.count += 1;
};

const registerSuccessfulLogin = (ip: string): void => {
    loginAttemptsByIp.delete(ip);
};

export const login = async (username: string, password: string, ip: string) => {
    assertLoginRateLimit(ip);

    const invalidCredentialsError = new AuthManagerError("Nome utente o password non validi", 401);
    const rows = await db.select().from(userTable).where(eq(userTable.username, username)).limit(1);
    const user = rows[0];

    // Verifica sempre una password (reale o esca) così il tempo di risposta non rivela
    // se lo username esiste.
    const isPasswordValid = await verifyPassword(password, user ? user.passwordHash : await getDummyPasswordHash());

    if (!user || !isPasswordValid) {
        registerFailedLogin(ip);
        throw invalidCredentialsError;
    }

    registerSuccessfulLogin(ip);

    if (!user.active) {
        throw new AuthManagerError("Questo account è stato disabilitato. Contatta un amministratore.", 403);
    }

    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + sessionDurationMs);
    await db.insert(sessionTable).values({ token, userId: user.id, expiresAt });

    const adminId = await getAdminUserId();
    return { token, expiresAt, user: toPublicUser(user, user.id === adminId) };
};

export const getSessionUser = async (token: string): Promise<PublicUser | null> => {
    const rows = await db
        .select({
            expiresAt: sessionTable.expiresAt,
            id: userTable.id,
            username: userTable.username,
            created_at: userTable.created_at,
            mustChangePassword: userTable.mustChangePassword,
            active: userTable.active,
        })
        .from(sessionTable)
        .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
        .where(eq(sessionTable.token, token))
        .limit(1);

    const row = rows[0];
    if (!row) {
        return null;
    }

    if (row.expiresAt.getTime() <= Date.now() || !row.active) {
        await db.delete(sessionTable).where(eq(sessionTable.token, token));
        return null;
    }

    const adminId = await getAdminUserId();
    return toPublicUser(row, row.id === adminId);
};

export const deleteSession = (token: string) => db.delete(sessionTable).where(eq(sessionTable.token, token));

export const deleteAllSessionsForUser = (userId: number) =>
    db.delete(sessionTable).where(eq(sessionTable.userId, userId));

const deleteOtherSessionsForUser = (userId: number, currentToken: string) =>
    db.delete(sessionTable).where(and(eq(sessionTable.userId, userId), ne(sessionTable.token, currentToken)));

export const listUsers = async (): Promise<PublicUser[]> => {
    const [rows, adminId] = await Promise.all([
        db.select().from(userTable).orderBy(userTable.username),
        getAdminUserId(),
    ]);
    return rows.map((row) => toPublicUser(row, row.id === adminId));
};

export const createUser = async (username: string) => {
    const password = generateRandomPassword();
    const passwordHash = await hashPassword(password);
    const [user] = await db
        .insert(userTable)
        .values({ username, passwordHash, mustChangePassword: true })
        .returning();

    const adminId = await getAdminUserId();
    return { user: toPublicUser(user, user.id === adminId), generatedPassword: password };
};

export const regeneratePassword = async (userId: number) => {
    const rows = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);
    const user = rows[0];
    if (!user) {
        throw new AuthManagerError("Utente non trovato", 404);
    }

    const password = generateRandomPassword();
    const passwordHash = await hashPassword(password);
    await db.update(userTable).set({ passwordHash, mustChangePassword: true }).where(eq(userTable.id, userId));
    // La vecchia password smette di funzionare: chiunque fosse loggato con quell'account
    // (incluso un eventuale ladro di sessione) deve rifare il login con quella nuova.
    await deleteAllSessionsForUser(userId);

    const adminId = await getAdminUserId();
    return {
        user: { ...toPublicUser(user, user.id === adminId), mustChangePassword: true },
        generatedPassword: password,
    };
};

export const setUserActive = async (userId: number, active: boolean): Promise<PublicUser> => {
    const rows = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);
    const user = rows[0];
    if (!user) {
        throw new AuthManagerError("Utente non trovato", 404);
    }

    const [updated] = await db.update(userTable).set({ active }).where(eq(userTable.id, userId)).returning();

    if (!active) {
        // Disattivare l'account deve invalidare subito eventuali sessioni già aperte.
        await deleteAllSessionsForUser(userId);
    }

    const adminId = await getAdminUserId();
    return toPublicUser(updated, updated.id === adminId);
};

export const changeOwnPassword = async (
    userId: number,
    currentPassword: string,
    newPassword: string,
    currentSessionToken: string
): Promise<void> => {
    const rows = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);
    const user = rows[0];
    if (!user) {
        throw new AuthManagerError("Utente non trovato", 404);
    }

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
        throw new AuthManagerError("La password attuale non è corretta", 400);
    }

    const passwordHash = await hashPassword(newPassword);
    await db
        .update(userTable)
        .set({ passwordHash, mustChangePassword: false })
        .where(eq(userTable.id, userId));
    // Disconnette tutte le altre sessioni (es. un token rubato), mantenendo attiva solo quella corrente.
    await deleteOtherSessionsForUser(userId, currentSessionToken);
};
