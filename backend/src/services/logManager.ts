import fs from "node:fs";
import path from "node:path";

const logDir = path.join(process.cwd(), "logs");
const logFilePrefix = "user-actions-";
const logFileExtension = ".log";
const maxLogFiles = 7;
const dayKeyPattern = /^\d{4}-\d{2}-\d{2}$/;
const dailyLogFileNamePattern = /^user-actions-\d{4}-\d{2}-\d{2}\.log$/;
let lastCleanupDay = "";

export class LogManagerError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

export type LogEntry = {
    timestamp: string;
    ip: string;
    action: string;
    status: number;
    error: string | null;
};

export type LogFileSummary = {
    dayKey: string;
    sizeBytes: number;
    updatedAt: string;
};

export const getDayKey = (date: Date) => date.toISOString().slice(0, 10);

const getDailyLogFilePath = (dayKey: string) => path.join(logDir, `${logFilePrefix}${dayKey}${logFileExtension}`);

const extractDayKey = (fileName: string) => fileName.slice(logFilePrefix.length, logFilePrefix.length + 10);

const cleanupOldDailyLogs = async () => {
    const dirEntries = await fs.promises.readdir(logDir, { withFileTypes: true });
    const logFiles = dirEntries
        .filter((entry) => entry.isFile() && dailyLogFileNamePattern.test(entry.name))
        .map((entry) => entry.name)
        .sort();

    if (logFiles.length <= maxLogFiles) {
        return;
    }

    const filesToDelete = logFiles.slice(0, logFiles.length - maxLogFiles);
    await Promise.all(filesToDelete.map((fileName) => fs.promises.unlink(path.join(logDir, fileName))));
};

export const appendUserActionLog = async (logLine: string, dayKey: string) => {
    await fs.promises.mkdir(logDir, { recursive: true });
    await fs.promises.appendFile(getDailyLogFilePath(dayKey), logLine);

    if (lastCleanupDay !== dayKey) {
        await cleanupOldDailyLogs();
        lastCleanupDay = dayKey;
    }
};

export const listLogFiles = async (): Promise<LogFileSummary[]> => {
    let dirEntries: fs.Dirent[];

    try {
        dirEntries = await fs.promises.readdir(logDir, { withFileTypes: true });
    } catch {
        return [];
    }

    const logFileNames = dirEntries
        .filter((entry) => entry.isFile() && dailyLogFileNamePattern.test(entry.name))
        .map((entry) => entry.name);

    const summaries = await Promise.all(
        logFileNames.map(async (fileName) => {
            const stat = await fs.promises.stat(path.join(logDir, fileName));
            return {
                dayKey: extractDayKey(fileName),
                sizeBytes: stat.size,
                updatedAt: stat.mtime.toISOString(),
            };
        })
    );

    return summaries.sort((a, b) => b.dayKey.localeCompare(a.dayKey));
};

const logLinePattern = /^(\S+) \| ip=(\S+) \| action=(.+?) \| status=(\d+)(?: \| error=(.*))?$/;

const parseLogLine = (line: string): LogEntry | null => {
    const match = logLinePattern.exec(line);

    if (!match) {
        return null;
    }

    const [, timestamp, ip, action, status, error] = match;

    return {
        timestamp,
        ip,
        action,
        status: Number(status),
        error: error ?? null,
    };
};

export const getLogFilePath = (dayKey: string) => {
    if (!dayKeyPattern.test(dayKey)) {
        throw new LogManagerError("Data non valida", 400);
    }

    return getDailyLogFilePath(dayKey);
};

export const readLogEntries = async (dayKey: string): Promise<LogEntry[]> => {
    const filePath = getLogFilePath(dayKey);

    let content: string;

    try {
        content = await fs.promises.readFile(filePath, "utf-8");
    } catch {
        throw new LogManagerError("Nessun log trovato per la data richiesta", 404);
    }

    return content
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map(parseLogLine)
        .filter((entry): entry is LogEntry => entry !== null)
        .reverse();
};
