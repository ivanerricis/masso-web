import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { decryptSecret, encryptSecret } from "./secretCrypto";

const settingsDir = path.join(process.cwd(), "data");
const settingsFilePath = path.join(settingsDir, "email-settings.json");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailSettingsState = {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    fromName: string;
    fromEmail: string;
    passwordEncrypted: string | null;
};

export type EmailConnectionConfig = {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
};

export type EmailConnectionTestConfig = EmailConnectionConfig & {
    fromName: string;
    fromEmail: string;
};

export class EmailManagerError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

const defaultState: EmailSettingsState = {
    enabled: false,
    host: "",
    port: 587,
    secure: false,
    username: "",
    fromName: "",
    fromEmail: "",
    passwordEncrypted: null,
};

let cachedState: EmailSettingsState | null = null;

const sanitizeState = (input: Partial<EmailSettingsState>): EmailSettingsState => {
    const port = Number(input.port ?? defaultState.port);

    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        throw new EmailManagerError("La porta SMTP deve essere un numero valido", 400);
    }

    return {
        enabled: Boolean(input.enabled ?? defaultState.enabled),
        host: typeof input.host === "string" ? input.host.trim() : defaultState.host,
        port,
        secure: Boolean(input.secure ?? defaultState.secure),
        username: typeof input.username === "string" ? input.username.trim() : defaultState.username,
        fromName: typeof input.fromName === "string" ? input.fromName.trim() : defaultState.fromName,
        fromEmail: typeof input.fromEmail === "string" ? input.fromEmail.trim() : defaultState.fromEmail,
        passwordEncrypted: typeof input.passwordEncrypted === "string" ? input.passwordEncrypted : null,
    };
};

const persistState = async (state: EmailSettingsState) => {
    await fs.promises.mkdir(settingsDir, { recursive: true });
    await fs.promises.writeFile(settingsFilePath, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
};

const loadState = async () => {
    if (cachedState) {
        return cachedState;
    }

    try {
        const raw = await fs.promises.readFile(settingsFilePath, "utf-8");
        cachedState = sanitizeState(JSON.parse(raw) as Partial<EmailSettingsState>);
    } catch {
        cachedState = { ...defaultState };
        await persistState(cachedState);
    }

    return cachedState;
};

export type EmailSettingsPublic = Omit<EmailSettingsState, "passwordEncrypted"> & {
    passwordSet: boolean;
};

const toPublicState = (state: EmailSettingsState): EmailSettingsPublic => {
    const { passwordEncrypted, ...rest } = state;
    return { ...rest, passwordSet: Boolean(passwordEncrypted) };
};

export const getEmailSettings = async (): Promise<EmailSettingsPublic> => {
    const state = await loadState();
    return toPublicState(state);
};

export type EmailSettingsInput = Pick<
    EmailSettingsState,
    "enabled" | "host" | "port" | "secure" | "username" | "fromName" | "fromEmail"
> & { password?: string };

export const updateEmailSettings = async (input: EmailSettingsInput) => {
    const current = await loadState();

    current.enabled = input.enabled;
    current.host = input.host.trim();
    current.port = input.port;
    current.secure = input.secure;
    current.username = input.username.trim();
    current.fromName = input.fromName.trim();
    current.fromEmail = input.fromEmail.trim();

    if (input.password) {
        current.passwordEncrypted = await encryptSecret(input.password);
    }

    if (current.enabled) {
        if (!current.host || !current.username || !current.fromEmail) {
            throw new EmailManagerError("Per abilitare l'invio email specifica host, utente ed email mittente", 400);
        }

        if (!emailPattern.test(current.fromEmail)) {
            throw new EmailManagerError("L'email mittente non è valida", 400);
        }

        if (!current.passwordEncrypted) {
            throw new EmailManagerError("Specifica una password per l'account email", 400);
        }
    }

    await persistState(current);

    return toPublicState(current);
};

const buildTransporter = (config: EmailConnectionConfig) =>
    nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.username,
            pass: config.password,
        },
    });

export const testEmailConnection = async (config: EmailConnectionTestConfig) => {
    const transporter = buildTransporter(config);

    try {
        await transporter.sendMail({
            from: config.fromName ? `"${config.fromName}" <${config.fromEmail}>` : config.fromEmail,
            to: config.fromEmail,
            subject: "Email di test - Masso",
            text: "Questa è una email di test per verificare le impostazioni SMTP configurate in Masso. Se la ricevi, la configurazione funziona correttamente.",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Invio email di test non riuscito";
        throw new EmailManagerError(message, 502);
    }
};

export type SendEmailInput = {
    to: string;
    subject: string;
    text: string;
    attachment: {
        filename: string;
        content: Buffer;
    };
};

export const sendEmail = async (input: SendEmailInput) => {
    const state = await loadState();

    if (!state.enabled) {
        throw new EmailManagerError("L'invio email non è abilitato nelle impostazioni", 400);
    }

    if (!state.host || !state.username || !state.fromEmail || !state.passwordEncrypted) {
        throw new EmailManagerError("Le impostazioni email non sono configurate correttamente", 400);
    }

    const password = await decryptSecret(state.passwordEncrypted);
    const transporter = buildTransporter({
        host: state.host,
        port: state.port,
        secure: state.secure,
        username: state.username,
        password,
    });

    try {
        await transporter.sendMail({
            from: state.fromName ? `"${state.fromName}" <${state.fromEmail}>` : state.fromEmail,
            to: input.to,
            subject: input.subject,
            text: input.text,
            attachments: [input.attachment],
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Invio email non riuscito";
        throw new EmailManagerError(message, 502);
    }
};
