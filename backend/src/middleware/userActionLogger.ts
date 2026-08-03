import type { NextFunction, Request, Response } from "express";
import { appendUserActionLog, getDayKey } from "../services/logManager";
// Prima qui c'era una copia locale che prendeva la prima entry di X-Forwarded-For: un
// valore scrivibile dal chiamante, quindi un IP a piacere nel registro delle azioni.
// Un log di controllo falsificabile da chi lo dovrebbe incriminare non serve a niente.
import { getClientIp } from "./clientIp";

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
        const rawUsername = request.user?.username ?? "";
        const user = rawUsername.replace(/\|/g, "/").replace(/\s+/g, " ").trim() || "-";
        const rawErrorMessage =
            typeof response.locals.apiErrorMessage === "string" ? response.locals.apiErrorMessage : "";
        const cleanErrorMessage = rawErrorMessage.replace(/\s+/g, " ").trim();
        const errorPart = status >= 400 ? ` | error=${cleanErrorMessage || `HTTP ${status}`}` : "";
        const logLine = `${timestamp} | ip=${ip} | user=${user} | action=${action} | status=${status}${errorPart}\n`;

        void appendUserActionLog(logLine, dayKey).catch((error) => {
            console.error("Impossibile scrivere il log azioni utente:", error);
        });
    });

    next();
};
