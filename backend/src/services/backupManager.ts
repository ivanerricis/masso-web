import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const settingsDir = path.join(process.cwd(), "data");
const settingsFilePath = path.join(settingsDir, "backup-settings.json");
const defaultOutputDir = "backups";
const defaultMaxBackupsToKeep = 14;
const dumpFileNamePattern = /^db-dump-\d{8}-\d{6}\.sql$/;

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

    if (!Number.isInteger(frequencyDays) || frequencyDays <= 0 || frequencyDays > 365) {
        throw new BackupManagerError("La frequenza deve essere tra 1 e 365 giorni", 400);
    }

    if (!Number.isInteger(maxBackupsToKeep) || maxBackupsToKeep <= 0 || maxBackupsToKeep > 365) {
        throw new BackupManagerError("Il numero di backup da mantenere deve essere tra 1 e 365", 400);
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

export const getBackupSettings = async () => {
    const state = await loadState();
    return { ...state };
};

export const updateBackupSettings = async (
    input: Pick<
        BackupSettingsState,
        "dumpEnabled" | "autoEnabled" | "frequencyDays" | "runAt" | "outputDir" | "maxBackupsToKeep"
    >
) => {
    const current = await loadState();

    current.dumpEnabled = input.dumpEnabled;
    current.autoEnabled = input.autoEnabled;
    current.frequencyDays = input.frequencyDays;
    current.runAt = input.runAt;
    current.outputDir = getConfiguredOutputDir();
    current.maxBackupsToKeep = input.maxBackupsToKeep;

    setNextRunIfNeeded(current, new Date());
    await persistState(current);

    return { ...current };
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
        setNextRunIfNeeded(state, now);
        await persistState(state);

        return {
            ...state,
            message: origin === "manual" ? "Dump completato con successo" : "Dump automatico completato",
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
