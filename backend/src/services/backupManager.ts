import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { decryptSecret, encryptSecret } from "./secretCrypto";
import { getCompanySettings, invalidateCompanySettingsCache } from "./companyManager";
import { invalidateEmailSettingsCache, isEmailConfigured, isStoredEmailPasswordUsable, sendEmail } from "./emailManager";
import { recordNotification } from "./notificationManager";

const settingsDir = path.join(process.cwd(), "data");
const settingsFilePath = path.join(settingsDir, "backup-settings.json");
const defaultOutputDir = "backups";
const defaultMaxBackupsToKeep = 14;
// Formato storico: solo il dump SQL. Ancora accettato in lettura/ripristino.
const legacyDumpFileNamePattern = /^db-dump-\d{8}-\d{6}\.sql$/;
// Formato attuale: archivio con il dump più le impostazioni scritte dall'app.
const archiveFileNamePattern = /^db-backup-\d{8}-\d{6}\.tar\.gz$/;
const isBackupFileName = (fileName: string) =>
    legacyDumpFileNamePattern.test(fileName) || archiveFileNamePattern.test(fileName);
const isArchiveFileName = (fileName: string) => /\.tar\.gz$/i.test(fileName);

// I due formati hanno prefissi diversi ma lo stesso timestamp YYYYMMDD-HHMMSS.
// Ordinare per nome intero metterebbe tutti i "db-backup-" prima di tutti i
// "db-dump-" ('b' < 'd') a prescindere dalla data, facendo passare per piu vecchio
// l'archivio appena creato. L'ordine cronologico va preso dal timestamp.
export const getBackupSortKey = (fileName: string) => fileName.match(/(\d{8}-\d{6})/)?.[1] ?? "";

/** Dal piu vecchio al piu recente. */
export const sortBackupFileNamesByAge = (fileNames: string[]) =>
    [...fileNames].sort((a, b) => getBackupSortKey(a).localeCompare(getBackupSortKey(b)));

const archiveDumpEntry = "dump.sql";
const archiveDataEntry = "data";
// Elenco esplicito invece di una lista di esclusioni: un file nuovo in data/ non
// finisce nel backup per sbaglio. `secret.key` è escluso di proposito (aprirebbe i
// segreti cifrati custoditi nello stesso archivio, che finisce anche su NAS), e con
// esso `initial-admin-password.txt`, che è una credenziale in chiaro.
const backedUpDataEntries = ["email-settings.json", "backup-settings.json", "company-settings.json", "logo"];
const defaultSmbPort = 445;
const smbTestTimeoutMs = 15_000;
const smbMkdirTimeoutMs = 15_000;
const smbPutTimeoutMs = 30 * 60 * 1000;

export type BackupSettingsState = {
    autoEnabled: boolean;
    frequencyDays: number;
    runAt: string;
    outputDir: string;
    maxBackupsToKeep: number;
    nextRunAt: string | null;
    lastRunAt: string | null;
    lastRunStatus: "idle" | "success" | "failed";
    /** Chi ha avviato l'ultima esecuzione: serve ad avvisare solo sui fallimenti non presidiati. */
    lastRunOrigin: "manual" | "auto" | null;
    lastError: string | null;
    lastDumpPath: string | null;
    /** Avvisa via email (oltre alla notifica in app) quando un backup automatico fallisce. */
    notifyEmailOnFailure: boolean;
    smbEnabled: boolean;
    smbHost: string;
    smbShare: string;
    smbPath: string;
    smbDomain: string;
    smbPort: number;
    smbUsername: string;
    smbPasswordEncrypted: string | null;
    smbLastRunAt: string | null;
    smbLastStatus: "idle" | "success" | "failed";
    smbLastError: string | null;
    lastRestoreAt: string | null;
    lastRestoreStatus: "idle" | "success" | "failed";
    lastRestoreError: string | null;
    lastRestoreFileName: string | null;
};

export type SmbConnectionConfig = {
    host: string;
    share: string;
    path: string;
    domain: string;
    port: number;
    username: string;
    password: string;
};

export class BackupManagerError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

const defaultState: BackupSettingsState = {
    autoEnabled: false,
    frequencyDays: 1,
    runAt: "02:00",
    outputDir: defaultOutputDir,
    maxBackupsToKeep: defaultMaxBackupsToKeep,
    nextRunAt: null,
    lastRunAt: null,
    lastRunStatus: "idle",
    lastRunOrigin: null,
    lastError: null,
    lastDumpPath: null,
    notifyEmailOnFailure: false,
    smbEnabled: false,
    smbHost: "",
    smbShare: "",
    smbPath: "",
    smbDomain: "",
    smbPort: defaultSmbPort,
    smbUsername: "",
    smbPasswordEncrypted: null,
    smbLastRunAt: null,
    smbLastStatus: "idle",
    smbLastError: null,
    lastRestoreAt: null,
    lastRestoreStatus: "idle",
    lastRestoreError: null,
    lastRestoreFileName: null,
};

let cachedState: BackupSettingsState | null = null;
let dumpInProgress = false;
let restoreInProgress = false;
let schedulerStarted = false;
let schedulerTimer: NodeJS.Timeout | null = null;

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const getConfiguredOutputDir = () => defaultOutputDir;

const toAbsoluteOutputDir = (outputDir: string) => {
    if (path.isAbsolute(outputDir)) {
        return outputDir;
    }

    return path.join(process.cwd(), outputDir);
};

const getDayTimestamp = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
};

const buildArchiveFilePath = (outputDir: string, now: Date) => {
    const absoluteOutputDir = toAbsoluteOutputDir(outputDir);
    const fileName = `db-backup-${getDayTimestamp(now)}.tar.gz`;

    return path.join(absoluteOutputDir, fileName);
};

const parseRunTime = (runAt: string) => {
    const match = runAt.match(timePattern);

    if (!match) {
        throw new BackupManagerError("Formato orario non valido. Usa HH:mm", 400);
    }

    return {
        hours: Number(match[1]),
        minutes: Number(match[2]),
    };
};

const computeNextRunAt = (referenceDate: Date, frequencyDays: number, runAt: string) => {
    const { hours, minutes } = parseRunTime(runAt);
    const candidate = new Date(referenceDate);
    candidate.setSeconds(0, 0);
    candidate.setHours(hours, minutes, 0, 0);

    if (candidate.getTime() <= referenceDate.getTime()) {
        candidate.setDate(candidate.getDate() + frequencyDays);
    }

    return candidate.toISOString();
};

const sanitizeState = (input: Partial<BackupSettingsState>): BackupSettingsState => {
    const frequencyDays = Number(input.frequencyDays ?? defaultState.frequencyDays);
    const runAt = typeof input.runAt === "string" ? input.runAt : defaultState.runAt;
    const maxBackupsToKeep = Number(input.maxBackupsToKeep ?? defaultState.maxBackupsToKeep);
    const smbPort = Number(input.smbPort ?? defaultState.smbPort);

    if (!Number.isInteger(frequencyDays) || frequencyDays <= 0 || frequencyDays > 365) {
        throw new BackupManagerError("La frequenza deve essere tra 1 e 365 giorni", 400);
    }

    if (!Number.isInteger(maxBackupsToKeep) || maxBackupsToKeep <= 0 || maxBackupsToKeep > 365) {
        throw new BackupManagerError("Il numero di backup da mantenere deve essere tra 1 e 365", 400);
    }

    if (!Number.isInteger(smbPort) || smbPort <= 0 || smbPort > 65535) {
        throw new BackupManagerError("La porta SMB deve essere un numero valido", 400);
    }

    parseRunTime(runAt);

    return {
        autoEnabled: Boolean(input.autoEnabled ?? defaultState.autoEnabled),
        frequencyDays,
        runAt,
        outputDir: getConfiguredOutputDir(),
        maxBackupsToKeep,
        nextRunAt: typeof input.nextRunAt === "string" ? input.nextRunAt : null,
        lastRunAt: typeof input.lastRunAt === "string" ? input.lastRunAt : null,
        lastRunStatus:
            input.lastRunStatus === "success" || input.lastRunStatus === "failed" || input.lastRunStatus === "idle"
                ? input.lastRunStatus
                : defaultState.lastRunStatus,
        lastRunOrigin: input.lastRunOrigin === "manual" || input.lastRunOrigin === "auto" ? input.lastRunOrigin : null,
        lastError: typeof input.lastError === "string" ? input.lastError : null,
        lastDumpPath: typeof input.lastDumpPath === "string" ? input.lastDumpPath : null,
        notifyEmailOnFailure: Boolean(input.notifyEmailOnFailure ?? defaultState.notifyEmailOnFailure),
        smbEnabled: Boolean(input.smbEnabled ?? defaultState.smbEnabled),
        smbHost: typeof input.smbHost === "string" ? input.smbHost.trim() : defaultState.smbHost,
        smbShare: typeof input.smbShare === "string" ? input.smbShare.trim() : defaultState.smbShare,
        smbPath: typeof input.smbPath === "string" ? input.smbPath.trim() : defaultState.smbPath,
        smbDomain: typeof input.smbDomain === "string" ? input.smbDomain.trim() : defaultState.smbDomain,
        smbPort,
        smbUsername: typeof input.smbUsername === "string" ? input.smbUsername.trim() : defaultState.smbUsername,
        smbPasswordEncrypted:
            typeof input.smbPasswordEncrypted === "string" ? input.smbPasswordEncrypted : null,
        smbLastRunAt: typeof input.smbLastRunAt === "string" ? input.smbLastRunAt : null,
        smbLastStatus:
            input.smbLastStatus === "success" || input.smbLastStatus === "failed" || input.smbLastStatus === "idle"
                ? input.smbLastStatus
                : defaultState.smbLastStatus,
        smbLastError: typeof input.smbLastError === "string" ? input.smbLastError : null,
        lastRestoreAt: typeof input.lastRestoreAt === "string" ? input.lastRestoreAt : null,
        lastRestoreStatus:
            input.lastRestoreStatus === "success" ||
            input.lastRestoreStatus === "failed" ||
            input.lastRestoreStatus === "idle"
                ? input.lastRestoreStatus
                : defaultState.lastRestoreStatus,
        lastRestoreError: typeof input.lastRestoreError === "string" ? input.lastRestoreError : null,
        lastRestoreFileName: typeof input.lastRestoreFileName === "string" ? input.lastRestoreFileName : null,
    };
};

const persistState = async (state: BackupSettingsState) => {
    await fs.promises.mkdir(settingsDir, { recursive: true });
    await fs.promises.writeFile(settingsFilePath, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
};

const loadState = async () => {
    if (cachedState) {
        return cachedState;
    }

    try {
        const raw = await fs.promises.readFile(settingsFilePath, "utf-8");
        cachedState = sanitizeState(JSON.parse(raw) as Partial<BackupSettingsState>);
    } catch {
        cachedState = { ...defaultState };
        await persistState(cachedState);
    }

    return cachedState;
};

const parseDatabaseUrl = () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new BackupManagerError("Variabile DATABASE_URL non configurata", 500);
    }

    let parsed: URL;

    try {
        parsed = new URL(databaseUrl);
    } catch {
        throw new BackupManagerError("DATABASE_URL non valida", 500);
    }

    const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));

    if (!databaseName) {
        throw new BackupManagerError("Nome database mancante in DATABASE_URL", 500);
    }

    return {
        host: parsed.hostname,
        port: parsed.port || "5432",
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        databaseName,
    };
};

const runPgDump = async (outputPath: string) => {
    const { host, port, user, password, databaseName } = parseDatabaseUrl();

    const args = [
        "--no-owner",
        "--no-privileges",
        "--format=plain",
        "--encoding=UTF8",
        "-h",
        host,
        "-p",
        port,
        "-U",
        user,
        "-d",
        databaseName,
        "-f",
        outputPath,
    ];

    const env = {
        ...process.env,
        PGPASSWORD: password,
    };

    await new Promise<void>((resolve, reject) => {
        const child = spawn("pg_dump", args, { env });
        let stderr = "";

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        child.on("error", (error: NodeJS.ErrnoException) => {
            if (error.code === "ENOENT") {
                reject(new BackupManagerError("pg_dump non trovato. Installa postgresql-client nel backend", 500));
                return;
            }

            reject(new BackupManagerError(`Errore avvio pg_dump: ${error.message}`, 500));
        });

        child.on("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            const message = stderr.trim() || `pg_dump terminato con codice ${code}`;
            reject(new BackupManagerError(message, 500));
        });
    });
};

const runTar = async (args: string[]) => {
    await new Promise<void>((resolve, reject) => {
        const child = spawn("tar", args);
        let stderr = "";

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        child.on("error", (error: NodeJS.ErrnoException) => {
            if (error.code === "ENOENT") {
                reject(new BackupManagerError("tar non trovato nel container backend", 500));
                return;
            }

            reject(new BackupManagerError(`Errore avvio tar: ${error.message}`, 500));
        });

        child.on("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(new BackupManagerError(stderr.trim() || `tar terminato con codice ${code}`, 500));
        });
    });
};

// Assembla dump + impostazioni in una cartella temporanea e la comprime.
const createBackupArchive = async (archivePath: string) => {
    const stagingDir = path.join(settingsDir, `tmp-backup-${Date.now()}`);
    const stagingDataDir = path.join(stagingDir, archiveDataEntry);

    try {
        await fs.promises.mkdir(stagingDataDir, { recursive: true });
        await runPgDump(path.join(stagingDir, archiveDumpEntry));

        for (const entry of backedUpDataEntries) {
            // `force: false` di default: le voci assenti (es. email mai configurata)
            // vengono semplicemente saltate.
            await fs.promises
                .cp(path.join(settingsDir, entry), path.join(stagingDataDir, entry), { recursive: true })
                .catch(() => {});
        }

        await fs.promises.mkdir(path.dirname(archivePath), { recursive: true });
        await runTar(["-czf", archivePath, "-C", stagingDir, archiveDumpEntry, archiveDataEntry]);
    } finally {
        await fs.promises.rm(stagingDir, { recursive: true, force: true }).catch(() => {});
    }
};

const runPsql = async (args: string[]) => {
    const { host, port, user, password, databaseName } = parseDatabaseUrl();

    const fullArgs = ["-h", host, "-p", port, "-U", user, "-d", databaseName, "-v", "ON_ERROR_STOP=1", ...args];

    const env = {
        ...process.env,
        PGPASSWORD: password,
    };

    await new Promise<void>((resolve, reject) => {
        const child = spawn("psql", fullArgs, { env });
        let stderr = "";

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        child.on("error", (error: NodeJS.ErrnoException) => {
            if (error.code === "ENOENT") {
                reject(new BackupManagerError("psql non trovato. Installa postgresql-client nel backend", 500));
                return;
            }

            reject(new BackupManagerError(`Errore avvio psql: ${error.message}`, 500));
        });

        child.on("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            const message = stderr.trim() || `psql terminato con codice ${code}`;
            reject(new BackupManagerError(message, 500));
        });
    });
};

const resetPublicSchema = async () => {
    // Il dump include anche lo schema "drizzle" (tracking migrazioni di drizzle-orm), che il
    // container backend ricrea ad ogni avvio: va svuotato anche lui, non solo "public".
    await runPsql([
        "-c",
        "DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;",
    ]);
};

// L'invio non deve mai far fallire il backup: se non riesce (SMTP giù, credenziali
// scadute...) l'errore resta solo nei log, la notifica in app è già stata registrata.
const sendBackupFailureEmail = async (title: string, message: string) => {
    try {
        if (!(await isEmailConfigured())) {
            return;
        }

        const company = await getCompanySettings();

        if (!company.email) {
            return;
        }

        await sendEmail({
            to: company.email,
            subject: `${title} - ${company.name}`,
            text: `${title}\n\n${message}`,
        });
    } catch (error) {
        console.error("Invio email di avviso backup non riuscito:", error);
    }
};

// Un'esecuzione manuale ha gia' mostrato l'errore a chi l'ha lanciata; quella automatica
// gira di notte e senza notifica non la vedrebbe nessuno.
const notifyAutoBackupFailure = async (
    origin: "manual" | "auto",
    dedupeKey: string,
    title: string,
    message: string,
    notifyEmailOnFailure: boolean
) => {
    if (origin !== "auto") {
        return;
    }

    await recordNotification({
        dedupeKey,
        title,
        message,
        link: "/settings?section=backup",
        severity: "warning",
    });

    if (notifyEmailOnFailure) {
        await sendBackupFailureEmail(title, message);
    }
};

const smbTarget = (config: SmbConnectionConfig) => `//${config.host}/${config.share}`;

// smbclient stampa la maggior parte delle diagnostiche (NT_STATUS_*, "Connection to
// ... failed") su stdout, non su stderr. Guardare solo stderr lascia come unico
// messaggio "terminato con codice 1", che non dice nulla — e soprattutto impedisce a
// ensureSmbRemoteDir di riconoscere NT_STATUS_OBJECT_NAME_COLLISION, cioè il caso
// normalissimo di cartella remota già esistente.
export const composeSmbErrorMessage = (stderr: string, stdout: string, code: number | null) => {
    const details = [stderr.trim(), stdout.trim()].filter(Boolean).join(" | ");

    return details || `smbclient terminato con codice ${code}`;
};

const runSmbClient = async (config: SmbConnectionConfig, command: string, timeoutMs: number) => {
    const args = [smbTarget(config), "-U", config.username, "-p", String(config.port)];

    if (config.domain) {
        args.push("-W", config.domain);
    }

    args.push("-c", command);

    const env = {
        ...process.env,
        PASSWD: config.password,
    };

    await new Promise<void>((resolve, reject) => {
        const child = spawn("smbclient", args, { env });
        let stderr = "";
        let stdout = "";
        let timedOut = false;

        const timer = setTimeout(() => {
            timedOut = true;
            child.kill();
        }, timeoutMs);

        child.stdin?.end();

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        child.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });

        child.on("error", (error: NodeJS.ErrnoException) => {
            clearTimeout(timer);

            if (error.code === "ENOENT") {
                reject(new BackupManagerError("smbclient non trovato. Installa samba-client nel backend", 500));
                return;
            }

            reject(new BackupManagerError(`Errore avvio smbclient: ${error.message}`, 500));
        });

        child.on("close", (code) => {
            clearTimeout(timer);

            if (timedOut) {
                reject(new BackupManagerError("Timeout durante la comunicazione con il NAS", 504));
                return;
            }

            if (code === 0) {
                resolve();
                return;
            }

            reject(new BackupManagerError(composeSmbErrorMessage(stderr, stdout, code), 502));
        });
    });
};

const quoteSmbPathSegment = (value: string) => value.replace(/"/g, "");

// La cartella remota che esiste già è il caso normale, non un errore: dal secondo
// backup in poi il mkdir fallisce sempre così. Le versioni di Samba riportano la
// collisione con codici diversi, quindi si accettano entrambi.
export const isAlreadyExistsSmbError = (message: string) =>
    message.includes("NT_STATUS_OBJECT_NAME_COLLISION") ||
    message.includes("NT_STATUS_OBJECT_NAME_EXISTS");

const ensureSmbRemoteDir = async (config: SmbConnectionConfig) => {
    const remotePath = config.path.trim();

    if (!remotePath) {
        return;
    }

    try {
        await runSmbClient(config, `mkdir "${quoteSmbPathSegment(remotePath)}"`, smbMkdirTimeoutMs);
    } catch (error) {
        const message = error instanceof Error ? error.message : "";

        if (isAlreadyExistsSmbError(message)) {
            return;
        }

        throw error;
    }
};

export const testSmbConnection = async (config: SmbConnectionConfig) => {
    const remotePath = config.path.trim();
    const command = remotePath ? `cd "${quoteSmbPathSegment(remotePath)}"; ls` : "ls";

    await runSmbClient(config, command, smbTestTimeoutMs);
};

const uploadDumpToSmb = async (config: SmbConnectionConfig, localFilePath: string) => {
    await ensureSmbRemoteDir(config);

    const remotePath = config.path.trim();
    const fileName = path.basename(localFilePath);
    const putCommand = `put "${localFilePath}" "${fileName}"`;
    const command = remotePath ? `cd "${quoteSmbPathSegment(remotePath)}"; ${putCommand}` : putCommand;

    await runSmbClient(config, command, smbPutTimeoutMs);
};

const pruneOldBackups = async (outputDir: string, keep: number) => {
    const absoluteOutputDir = toAbsoluteOutputDir(outputDir);

    let entries: string[];

    try {
        entries = await fs.promises.readdir(absoluteOutputDir);
    } catch {
        return;
    }

    const dumpFiles = sortBackupFileNamesByAge(entries.filter(isBackupFileName));
    const filesToDelete = dumpFiles.slice(0, Math.max(0, dumpFiles.length - keep));

    await Promise.all(
        filesToDelete.map((name) =>
            fs.promises.unlink(path.join(absoluteOutputDir, name)).catch(() => {})
        )
    );
};

const setNextRunIfNeeded = (state: BackupSettingsState, reference: Date) => {
    if (state.autoEnabled) {
        state.nextRunAt = computeNextRunAt(reference, state.frequencyDays, state.runAt);
        return;
    }

    state.nextRunAt = null;
};

export type BackupSettingsPublic = Omit<BackupSettingsState, "smbPasswordEncrypted"> & {
    smbPasswordSet: boolean;
    /** Segreti che con la chiave presente non sono leggibili e vanno reinseriti. */
    restoreSecretsToReconfigure: string[];
    /** Determina se la checkbox di avviso email può essere attivata dal frontend. */
    emailConfigured: boolean;
};

// Calcolato a ogni lettura invece di essere persistito: così l'avviso sparisce da
// solo appena la password viene reinserita, senza doverlo azzerare esplicitamente
// da ogni punto che salva le impostazioni.
const toPublicState = async (state: BackupSettingsState): Promise<BackupSettingsPublic> => {
    const { smbPasswordEncrypted, ...rest } = state;

    return {
        ...rest,
        smbPasswordSet: Boolean(smbPasswordEncrypted),
        restoreSecretsToReconfigure: await findSecretsToReconfigure(state),
        emailConfigured: await isEmailConfigured(),
    };
};

export const getBackupSettings = async (): Promise<BackupSettingsPublic> => {
    const state = await loadState();
    return toPublicState(state);
};

export type BackupSettingsInput = Pick<
    BackupSettingsState,
    | "autoEnabled"
    | "frequencyDays"
    | "runAt"
    | "outputDir"
    | "maxBackupsToKeep"
    | "notifyEmailOnFailure"
    | "smbEnabled"
    | "smbHost"
    | "smbShare"
    | "smbPath"
    | "smbDomain"
    | "smbPort"
    | "smbUsername"
> & { smbPassword?: string };

export const updateBackupSettings = async (input: BackupSettingsInput) => {
    const current = await loadState();

    current.autoEnabled = input.autoEnabled;
    current.frequencyDays = input.frequencyDays;
    current.runAt = input.runAt;
    current.outputDir = getConfiguredOutputDir();
    current.maxBackupsToKeep = input.maxBackupsToKeep;
    current.notifyEmailOnFailure = input.notifyEmailOnFailure;

    current.smbEnabled = input.smbEnabled;
    current.smbHost = input.smbHost.trim();
    current.smbShare = input.smbShare.trim();
    current.smbPath = input.smbPath.trim();
    current.smbDomain = input.smbDomain.trim();
    current.smbPort = input.smbPort;
    current.smbUsername = input.smbUsername.trim();

    if (input.smbPassword) {
        current.smbPasswordEncrypted = await encryptSecret(input.smbPassword);
    }

    if (current.smbEnabled && (!current.smbHost || !current.smbShare || !current.smbUsername)) {
        throw new BackupManagerError(
            "Per abilitare la destinazione NAS specifica host, condivisione e utente",
            400
        );
    }

    if (current.smbEnabled && !current.smbPasswordEncrypted) {
        throw new BackupManagerError("Specifica una password per la connessione al NAS", 400);
    }

    if (current.notifyEmailOnFailure && !(await isEmailConfigured())) {
        throw new BackupManagerError(
            "Per abilitare l'avviso email configura prima l'invio email nelle impostazioni",
            400
        );
    }

    setNextRunIfNeeded(current, new Date());
    await persistState(current);

    return await toPublicState(current);
};

export type BackupDumpFile = {
    fileName: string;
    sizeBytes: number;
    createdAt: string;
};

export const listBackupDumps = async (): Promise<BackupDumpFile[]> => {
    const absoluteOutputDir = toAbsoluteOutputDir(getConfiguredOutputDir());

    let entries: string[];

    try {
        entries = await fs.promises.readdir(absoluteOutputDir);
    } catch {
        return [];
    }

    const dumpFiles = entries.filter(isBackupFileName);

    const stats = await Promise.all(
        dumpFiles.map(async (fileName) => {
            const stat = await fs.promises.stat(path.join(absoluteOutputDir, fileName));
            return { fileName, sizeBytes: stat.size, createdAt: stat.mtime.toISOString() };
        })
    );

    // Piu recente in cima, con lo stesso criterio cronologico usato dalla retention.
    return stats.sort((a, b) => getBackupSortKey(b.fileName).localeCompare(getBackupSortKey(a.fileName)));
};

export const getBackupDumpPath = async (fileName: string) => {
    if (!isBackupFileName(fileName)) {
        throw new BackupManagerError("Nome file dump non valido", 400);
    }

    const absoluteOutputDir = toAbsoluteOutputDir(getConfiguredOutputDir());
    const filePath = path.join(absoluteOutputDir, fileName);

    try {
        await fs.promises.access(filePath);
    } catch {
        throw new BackupManagerError("File di dump non trovato", 404);
    }

    return filePath;
};

// Estrae l'archivio e restituisce dove trovare dump e impostazioni. Per il formato
// storico (.sql puro) non c'è nulla da estrarre e non ci sono impostazioni.
const prepareRestoreSource = async (filePath: string, sourceFileName: string) => {
    if (!isArchiveFileName(sourceFileName)) {
        return { sqlPath: filePath, dataDir: null as string | null, cleanup: async () => {} };
    }

    const extractDir = path.join(settingsDir, `tmp-extract-${Date.now()}`);
    await fs.promises.mkdir(extractDir, { recursive: true });

    try {
        await runTar(["-xzf", filePath, "-C", extractDir]);
    } catch (error) {
        await fs.promises.rm(extractDir, { recursive: true, force: true }).catch(() => {});
        throw error;
    }

    const sqlPath = path.join(extractDir, archiveDumpEntry);

    try {
        await fs.promises.access(sqlPath);
    } catch {
        await fs.promises.rm(extractDir, { recursive: true, force: true }).catch(() => {});
        throw new BackupManagerError(`Archivio non valido: manca ${archiveDumpEntry}`, 400);
    }

    return {
        sqlPath,
        dataDir: path.join(extractDir, archiveDataEntry),
        cleanup: async () => {
            await fs.promises.rm(extractDir, { recursive: true, force: true }).catch(() => {});
        },
    };
};

// Riporta le impostazioni dell'archivio in data/. `secret.key` non è nell'archivio
// e non viene toccata: quella presente sulla macchina resta valida.
const restoreDataEntries = async (dataDir: string) => {
    for (const entry of backedUpDataEntries) {
        const source = path.join(dataDir, entry);

        try {
            await fs.promises.access(source);
        } catch {
            continue;
        }

        await fs.promises.rm(path.join(settingsDir, entry), { recursive: true, force: true }).catch(() => {});
        await fs.promises.cp(source, path.join(settingsDir, entry), { recursive: true });
    }

    // I file sono cambiati sotto le cache in memoria dei due manager.
    cachedState = null;
    invalidateEmailSettingsCache();
    invalidateCompanySettingsCache();
};

// I segreti sono cifrati con data/secret.key, esclusa dai backup di proposito. Su una
// macchina con chiave diversa restano illeggibili: va detto subito e per iscritto,
// invece di lasciarlo scoprire al primo invio email o al primo upload su NAS.
const findSecretsToReconfigure = async (state: BackupSettingsState) => {
    const toReconfigure: string[] = [];

    if (!(await isStoredEmailPasswordUsable())) {
        toReconfigure.push("Password email (SMTP)");
    }

    if (state.smbPasswordEncrypted) {
        try {
            await decryptSecret(state.smbPasswordEncrypted);
        } catch {
            toReconfigure.push("Password NAS (SMB)");
        }
    }

    return toReconfigure;
};

const performRestore = async (filePath: string, resetSchema: boolean, sourceFileName: string) => {
    let state = await loadState();

    if (dumpInProgress || restoreInProgress) {
        throw new BackupManagerError("E gia in corso un'operazione sul database", 409);
    }

    restoreInProgress = true;
    const now = new Date();
    const source = await prepareRestoreSource(filePath, sourceFileName);

    try {
        if (resetSchema) {
            await resetPublicSchema();
        }

        await runPsql(["-f", source.sqlPath]);

        if (source.dataDir) {
            await restoreDataEntries(source.dataDir);
            // Le impostazioni appena riportate hanno sostituito quelle in memoria:
            // i campi di esito vanno scritti sopra lo stato ripristinato.
            state = await loadState();
        }

        const secretsToReconfigure = await findSecretsToReconfigure(state);

        state.lastRestoreAt = now.toISOString();
        state.lastRestoreStatus = "success";
        state.lastRestoreError = null;
        state.lastRestoreFileName = sourceFileName;
        await persistState(state);

        return {
            ...(await toPublicState(state)),
            message:
                secretsToReconfigure.length > 0
                    ? `Ripristino completato. Reinserisci a mano: ${secretsToReconfigure.join(", ")}.`
                    : "Ripristino completato con successo",
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Errore durante il ripristino del database";
        state.lastRestoreAt = now.toISOString();
        state.lastRestoreStatus = "failed";
        state.lastRestoreError = message;
        state.lastRestoreFileName = sourceFileName;
        await persistState(state);

        throw error;
    } finally {
        restoreInProgress = false;
        await source.cleanup();
    }
};

export const restoreBackupFromExisting = async (fileName: string, resetSchema: boolean) => {
    const filePath = await getBackupDumpPath(fileName);
    return performRestore(filePath, resetSchema, fileName);
};

const uploadedDumpNamePattern = /\.(sql|tar\.gz)$/i;

export const restoreBackupFromUpload = async (buffer: Buffer, originalFileName: string, resetSchema: boolean) => {
    if (!uploadedDumpNamePattern.test(originalFileName)) {
        throw new BackupManagerError("Il file caricato deve avere estensione .sql o .tar.gz", 400);
    }

    const tempDir = path.join(process.cwd(), "data", "tmp-restore");
    await fs.promises.mkdir(tempDir, { recursive: true });
    const suffix = isArchiveFileName(originalFileName) ? "tar.gz" : "sql";
    const tempFilePath = path.join(tempDir, `upload-${Date.now()}.${suffix}`);

    await fs.promises.writeFile(tempFilePath, buffer);

    try {
        return await performRestore(tempFilePath, resetSchema, originalFileName);
    } finally {
        await fs.promises.unlink(tempFilePath).catch(() => {});
    }
};

export const runBackupNow = async (origin: "manual" | "auto") => {
    const state = await loadState();

    if (origin === "auto" && !state.autoEnabled) {
        throw new BackupManagerError("Il dump automatico non e abilitato nelle impostazioni", 400);
    }

    if (dumpInProgress || restoreInProgress) {
        throw new BackupManagerError("E gia in corso un'operazione sul database", 409);
    }

    dumpInProgress = true;
    const now = new Date();

    try {
        const outputPath = buildArchiveFilePath(getConfiguredOutputDir(), now);
        await createBackupArchive(outputPath);
        await pruneOldBackups(getConfiguredOutputDir(), state.maxBackupsToKeep);

        state.lastRunAt = now.toISOString();
        state.lastRunStatus = "success";
        state.lastRunOrigin = origin;
        state.lastError = null;
        state.lastDumpPath = outputPath;

        let message = origin === "manual" ? "Dump completato con successo" : "Dump automatico completato";

        if (state.smbEnabled && state.smbPasswordEncrypted) {
            try {
                const smbConfig: SmbConnectionConfig = {
                    host: state.smbHost,
                    share: state.smbShare,
                    path: state.smbPath,
                    domain: state.smbDomain,
                    port: state.smbPort,
                    username: state.smbUsername,
                    password: await decryptSecret(state.smbPasswordEncrypted),
                };

                await uploadDumpToSmb(smbConfig, outputPath);

                state.smbLastRunAt = now.toISOString();
                state.smbLastStatus = "success";
                state.smbLastError = null;
            } catch (smbError) {
                const smbMessage =
                    smbError instanceof Error ? smbError.message : "Errore durante la copia su NAS";
                state.smbLastRunAt = now.toISOString();
                state.smbLastStatus = "failed";
                state.smbLastError = smbMessage;
                message = `${message}, ma la copia su NAS non e riuscita: ${smbMessage}`;

                await notifyAutoBackupFailure(
                    origin,
                    "backup:auto-nas-failed",
                    "Copia del backup su NAS non riuscita",
                    smbMessage,
                    state.notifyEmailOnFailure
                );
            }
        }

        setNextRunIfNeeded(state, now);
        await persistState(state);

        return {
            ...(await toPublicState(state)),
            message,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Errore durante il dump database";
        state.lastRunAt = now.toISOString();
        state.lastRunStatus = "failed";
        state.lastRunOrigin = origin;
        state.lastError = message;
        setNextRunIfNeeded(state, now);
        await persistState(state);

        await notifyAutoBackupFailure(
            origin,
            "backup:auto-failed",
            "Backup automatico non riuscito",
            message,
            state.notifyEmailOnFailure
        );

        throw error;
    } finally {
        dumpInProgress = false;
    }
};

export const startBackupScheduler = () => {
    if (schedulerStarted) {
        return;
    }

    schedulerStarted = true;

    schedulerTimer = setInterval(() => {
        void (async () => {
            if (dumpInProgress) {
                return;
            }

            try {
                const state = await loadState();

                if (!state.autoEnabled || !state.nextRunAt) {
                    return;
                }

                const now = new Date();
                const nextRunAt = new Date(state.nextRunAt);

                if (Number.isNaN(nextRunAt.getTime()) || now.getTime() < nextRunAt.getTime()) {
                    return;
                }

                await runBackupNow("auto");
            } catch (error) {
                console.error("Errore scheduler dump database:", error);
            }
        })();
    }, 60 * 1000);

    schedulerTimer.unref();
};

export const stopBackupScheduler = () => {
    if (!schedulerTimer) {
        return;
    }

    clearInterval(schedulerTimer);
    schedulerTimer = null;
    schedulerStarted = false;
};
