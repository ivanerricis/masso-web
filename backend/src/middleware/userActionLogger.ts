import type { NextFunction, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";

const logDir = path.join(process.cwd(), "logs");
const logFilePrefix = "user-actions-";
const logFileExtension = ".log";
const maxLogFiles = 7;
let lastCleanupDay = "";

const actionVerbByMethod: Record<string, string> = {
    POST: "creato",
    PUT: "modificato",
    PATCH: "modificato",
    DELETE: "eliminato",
};

const formatAction = (method: string, routePath: string) => {
    const normalizedPath = routePath.split("?")[0];

    const verb = actionVerbByMethod[method] ?? `eseguito ${method}`;
    return `${verb} ${normalizedPath}`;
};

const trackedMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const getClientIp = (request: Request) => {
    const forwardedFor = request.headers["x-forwarded-for"];

    if (typeof forwardedFor === "string" && forwardedFor.trim() !== "") {
        return forwardedFor.split(",")[0].trim();
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
        return forwardedFor[0] ?? request.ip;
    }

    return request.ip;
};

const getDayKey = (date: Date) => date.toISOString().slice(0, 10);

const getDailyLogFilePath = (dayKey: string) =>
    path.join(logDir, `${logFilePrefix}${dayKey}${logFileExtension}`);

const isDailyLogFile = (fileName: string) => {
    return /^user-actions-\d{4}-\d{2}-\d{2}\.log$/.test(fileName);
};

const cleanupOldDailyLogs = async () => {
    const dirEntries = await fs.promises.readdir(logDir, { withFileTypes: true });
    const logFiles = dirEntries
        .filter((entry) => entry.isFile() && isDailyLogFile(entry.name))
        .map((entry) => entry.name)
        .sort();

    if (logFiles.length <= maxLogFiles) {
        return;
    }

    const filesToDelete = logFiles.slice(0, logFiles.length - maxLogFiles);
    await Promise.all(filesToDelete.map((fileName) => fs.promises.unlink(path.join(logDir, fileName))));
};

const appendUserActionLog = async (logLine: string, dayKey: string) => {
    await fs.promises.mkdir(logDir, { recursive: true });
    await fs.promises.appendFile(getDailyLogFilePath(dayKey), logLine);

    if (lastCleanupDay !== dayKey) {
        await cleanupOldDailyLogs();
        lastCleanupDay = dayKey;
    }
};

export const userActionLogger = (request: Request, _response: Response, next: NextFunction) => {
    if (
        !request.originalUrl.startsWith("/api") ||
        request.originalUrl.startsWith("/api/health") ||
        !trackedMethods.has(request.method)
    ) {
        next();
        return;
    }

    const response = _response;
    const ip = getClientIp(request);
    const action = formatAction(request.method, request.originalUrl);
    response.once("finish", () => {
        const now = new Date();
        const timestamp = now.toISOString();
        const dayKey = getDayKey(now);
        const status = response.statusCode;
        const rawErrorMessage = typeof response.locals.apiErrorMessage === "string"
            ? response.locals.apiErrorMessage
            : "";
        const cleanErrorMessage = rawErrorMessage.replace(/\s+/g, " ").trim();
        const errorPart = status >= 400
            ? ` | error=${cleanErrorMessage || `HTTP ${status}`}`
            : "";
        const logLine = `${timestamp} | ip=${ip} | action=${action} | status=${status}${errorPart}\n`;

        void appendUserActionLog(logLine, dayKey).catch((error) => {
            console.error("Impossibile scrivere il log azioni utente:", error);
        });
    });

    next();
};
