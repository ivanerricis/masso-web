import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { decryptSecret, encryptSecret } from "./secretCrypto";

const settingsDir = path.join(process.cwd(), "data");
const settingsFilePath = path.join(settingsDir, "backup-settings.json");
const defaultOutputDir = "backups";
const defaultMaxBackupsToKeep = 14;
const dumpFileNamePattern = /^db-dump-\d{8}-\d{6}\.sql$/;
const defaultSmbPort = 445;
const smbTestTimeoutMs = 15_000;
const smbMkdirTimeoutMs = 15_000;
const smbPutTimeoutMs = 30 * 60 * 1000;

export type BackupSettingsState = {
    dumpEnabled: boolean;
    autoEnabled: boolean;
    frequencyDays: number;
    runAt: string;
    outputDir: string;
    maxBackupsToKeep: number;
    nextRunAt: string | null;
    lastRunAt: string | null;
    lastRunStatus: "idle" | "success" | "failed";
    lastError: string | null;
    lastDumpPath: string | null;
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
    dumpEnabled: false,
    autoEnabled: false,
    frequencyDays: 1,
    runAt: "02:00",
    outputDir: defaultOutputDir,
    maxBackupsToKeep: defaultMaxBackupsToKeep,
    nextRunAt: null,
    lastRunAt: null,
    lastRunStatus: "idle",
    lastError: null,
    lastDumpPath: null,
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
};

let cachedState: BackupSettingsState | null = null;
let dumpInProgress = false;
let schedulerStarted = false;
let schedulerTimer: NodeJS.Timeout | null = null;

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const normalizeOutputDir = (value: string) => {
    const trimmed = value.trim();
    return trimmed === "" ? defaultOutputDir : trimmed;
};

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

const buildDumpFilePath = (outputDir: string, now: Date) => {
    const absoluteOutputDir = toAbsoluteOutputDir(outputDir);
    const fileName = `db-dump-${getDayTimestamp(now)}.sql`;

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
        dumpEnabled: Boolean(input.dumpEnabled ?? defaultState.dumpEnabled),
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
        lastError: typeof input.lastError === "string" ? input.lastError : null,
        lastDumpPath: typeof input.lastDumpPath === "string" ? input.lastDumpPath : null,
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

const smbTarget = (config: SmbConnectionConfig) => `//${config.host}/${config.share}`;

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
        let timedOut = false;

        const timer = setTimeout(() => {
            timedOut = true;
            child.kill();
        }, timeoutMs);

        child.stdin?.end();

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
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

            const message = stderr.trim() || `smbclient terminato con codice ${code}`;
            reject(new BackupManagerError(message, 502));
        });
    });
};

const quoteSmbPathSegment = (value: string) => value.replace(/"/g, "");

const ensureSmbRemoteDir = async (config: SmbConnectionConfig) => {
    const remotePath = config.path.trim();

    if (!remotePath) {
        return;
    }

    try {
        await runSmbClient(config, `mkdir "${quoteSmbPathSegment(remotePath)}"`, smbMkdirTimeoutMs);
    } catch (error) {
        const message = error instanceof Error ? error.message : "";

        if (message.includes("NT_STATUS_OBJECT_NAME_COLLISION")) {
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

    const dumpFiles = entries.filter((name) => dumpFileNamePattern.test(name)).sort();
    const filesToDelete = dumpFiles.slice(0, Math.max(0, dumpFiles.length - keep));

    await Promise.all(
        filesToDelete.map((name) =>
            fs.promises.unlink(path.join(absoluteOutputDir, name)).catch(() => {})
        )
    );
};

const setNextRunIfNeeded = (state: BackupSettingsState, reference: Date) => {
    if (state.dumpEnabled && state.autoEnabled) {
        state.nextRunAt = computeNextRunAt(reference, state.frequencyDays, state.runAt);
        return;
    }

    state.nextRunAt = null;
};

export type BackupSettingsPublic = Omit<BackupSettingsState, "smbPasswordEncrypted"> & {
    smbPasswordSet: boolean;
};

const toPublicState = (state: BackupSettingsState): BackupSettingsPublic => {
    const { smbPasswordEncrypted, ...rest } = state;
    return { ...rest, smbPasswordSet: Boolean(smbPasswordEncrypted) };
};

export const getBackupSettings = async (): Promise<BackupSettingsPublic> => {
    const state = await loadState();
    return toPublicState(state);
};

export type BackupSettingsInput = Pick<
    BackupSettingsState,
    | "dumpEnabled"
    | "autoEnabled"
    | "frequencyDays"
    | "runAt"
    | "outputDir"
    | "maxBackupsToKeep"
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

    current.dumpEnabled = input.dumpEnabled;
    current.autoEnabled = input.autoEnabled;
    current.frequencyDays = input.frequencyDays;
    current.runAt = input.runAt;
    current.outputDir = getConfiguredOutputDir();
    current.maxBackupsToKeep = input.maxBackupsToKeep;

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

    setNextRunIfNeeded(current, new Date());
    await persistState(current);

    return toPublicState(current);
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

    const dumpFiles = entries.filter((name) => dumpFileNamePattern.test(name));

    const stats = await Promise.all(
        dumpFiles.map(async (fileName) => {
            const stat = await fs.promises.stat(path.join(absoluteOutputDir, fileName));
            return { fileName, sizeBytes: stat.size, createdAt: stat.mtime.toISOString() };
        })
    );

    return stats.sort((a, b) => b.fileName.localeCompare(a.fileName));
};

export const getBackupDumpPath = async (fileName: string) => {
    if (!dumpFileNamePattern.test(fileName)) {
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

export const runBackupNow = async (origin: "manual" | "auto") => {
    const state = await loadState();

    if (origin === "auto" && !state.dumpEnabled) {
        throw new BackupManagerError("Il dump database non e abilitato nelle impostazioni", 400);
    }

    if (dumpInProgress) {
        throw new BackupManagerError("E gia in corso un dump database", 409);
    }

    dumpInProgress = true;
    const now = new Date();

    try {
        const outputPath = buildDumpFilePath(getConfiguredOutputDir(), now);
        await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
        await runPgDump(outputPath);
        await pruneOldBackups(getConfiguredOutputDir(), state.maxBackupsToKeep);

        state.lastRunAt = now.toISOString();
        state.lastRunStatus = "success";
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
            }
        }

        setNextRunIfNeeded(state, now);
        await persistState(state);

        return {
            ...toPublicState(state),
            message,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Errore durante il dump database";
        state.lastRunAt = now.toISOString();
        state.lastRunStatus = "failed";
        state.lastError = message;
        setNextRunIfNeeded(state, now);
        await persistState(state);

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

                if (!state.dumpEnabled || !state.autoEnabled || !state.nextRunAt) {
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
