import path from "node:path";
import { type Response, Router } from "express";
import multer from "multer";
import { z } from "zod";
import { validate } from "./validation";
import {
    BackupManagerError,
    getBackupDumpPath,
    getBackupSettings,
    listBackupDumps,
    runBackupNow,
    testSmbConnection,
    updateBackupSettings,
} from "../services/backupManager";
import { EmailManagerError, getEmailSettings, testEmailConnection, updateEmailSettings } from "../services/emailManager";
import { LogoManagerError, getLogoStatus, resetLogo, saveLogo } from "../services/logoManager";
import { LogManagerError, getLogFilePath, listLogFiles, readLogEntries } from "../services/logManager";
import { UpdateManagerError, getUpdateStatus, requestUpdate, requestUpdateCheck } from "../services/updateManager";

const settingsRouter = Router();
const logoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const handleBackupError = (error: unknown, res: Response) => {
    if (error instanceof BackupManagerError) {
        res.locals.apiErrorMessage = error.message;
        res.status(error.statusCode).json({ message: error.message });
        return true;
    }

    return false;
};

const handleEmailError = (error: unknown, res: Response) => {
    if (error instanceof EmailManagerError) {
        res.locals.apiErrorMessage = error.message;
        res.status(error.statusCode).json({ message: error.message });
        return true;
    }

    return false;
};

const handleLogoError = (error: unknown, res: Response) => {
    if (error instanceof LogoManagerError) {
        res.locals.apiErrorMessage = error.message;
        res.status(error.statusCode).json({ message: error.message });
        return true;
    }

    return false;
};

const handleUpdateError = (error: unknown, res: Response) => {
    if (error instanceof UpdateManagerError) {
        res.locals.apiErrorMessage = error.message;
        res.status(error.statusCode).json({ message: error.message });
        return true;
    }

    return false;
};

const handleLogError = (error: unknown, res: Response) => {
    if (error instanceof LogManagerError) {
        res.locals.apiErrorMessage = error.message;
        res.status(error.statusCode).json({ message: error.message });
        return true;
    }

    return false;
};

const backupSettingsSchema = z.object({
    autoEnabled: z.boolean(),
    frequencyDays: z.coerce.number().int().min(1).max(365),
    runAt: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    outputDir: z.string().trim().min(1).max(512),
    maxBackupsToKeep: z.coerce.number().int().min(1).max(365),
    smbEnabled: z.boolean(),
    smbHost: z.string().trim().max(255),
    smbShare: z.string().trim().max(255),
    smbPath: z.string().trim().max(512),
    smbDomain: z.string().trim().max(255),
    smbPort: z.coerce.number().int().min(1).max(65535),
    smbUsername: z.string().trim().max(255),
    smbPassword: z.string().max(512).optional(),
}).strict();

const smbTestSchema = z.object({
    host: z.string().trim().min(1).max(255),
    share: z.string().trim().min(1).max(255),
    path: z.string().trim().max(512),
    domain: z.string().trim().max(255),
    port: z.coerce.number().int().min(1).max(65535),
    username: z.string().trim().min(1).max(255),
    password: z.string().min(1).max(512),
}).strict();

const emailSettingsSchema = z.object({
    enabled: z.boolean(),
    host: z.string().trim().max(255),
    port: z.coerce.number().int().min(1).max(65535),
    secure: z.boolean(),
    username: z.string().trim().max(255),
    password: z.string().max(512).optional(),
    fromName: z.string().trim().max(255),
    fromEmail: z.string().trim().max(255),
}).strict();

const emailTestSchema = z.object({
    host: z.string().trim().min(1).max(255),
    port: z.coerce.number().int().min(1).max(65535),
    secure: z.boolean(),
    username: z.string().trim().min(1).max(255),
    password: z.string().min(1).max(512),
    fromName: z.string().trim().max(255),
    fromEmail: z.string().trim().min(1).email().max(255),
}).strict();

const logDayKeyParamsSchema = z.object({
    dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();

const logEntriesQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(1000).optional(),
    search: z.string().trim().max(255).optional(),
}).strict();

settingsRouter.get("/logs", async (_req, res, next) => {
    try {
        const files = await listLogFiles();
        res.json(files);
    } catch (error) {
        if (handleLogError(error, res)) {
            return;
        }
        next(error);
    }
});

settingsRouter.get(
    "/logs/:dayKey",
    validate({ params: logDayKeyParamsSchema, query: logEntriesQuerySchema }),
    async (req, res, next) => {
        try {
            const { dayKey } = req.params as { dayKey: string };
            const { page = 1, pageSize = 50, search } = req.query as {
                page?: number;
                pageSize?: number;
                search?: string;
            };

            const allEntries = await readLogEntries(dayKey);
            const normalizedSearch = search?.toLowerCase();
            const filteredEntries = normalizedSearch
                ? allEntries.filter((entry) =>
                    `${entry.action} ${entry.ip} ${entry.error ?? ""}`.toLowerCase().includes(normalizedSearch)
                )
                : allEntries;

            const totalItems = filteredEntries.length;
            const startIndex = (page - 1) * pageSize;
            const items = filteredEntries.slice(startIndex, startIndex + pageSize);

            res.json({
                items,
                totalItems,
                page,
                pageSize,
                totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
            });
        } catch (error) {
            if (handleLogError(error, res)) {
                return;
            }
            next(error);
        }
    }
);

settingsRouter.get("/logs/:dayKey/download", validate({ params: logDayKeyParamsSchema }), async (req, res, next) => {
    try {
        const { dayKey } = req.params as { dayKey: string };
        const filePath = getLogFilePath(dayKey);

        res.download(filePath, path.basename(filePath), (error) => {
            if (error && !res.headersSent) {
                res.status(404).json({ message: "Log non trovato" });
            }
        });
    } catch (error) {
        if (handleLogError(error, res)) {
            return;
        }
        next(error);
    }
});

settingsRouter.get("/backup", async (_req, res, next) => {
    try {
        const settings = await getBackupSettings();
        res.json(settings);
    } catch (error) {
        if (handleBackupError(error, res)) {
            return;
        }
        next(error);
    }
});

settingsRouter.put("/backup", validate({ body: backupSettingsSchema }), async (req, res, next) => {
    try {
        const settings = await updateBackupSettings(req.body);
        res.json(settings);
    } catch (error) {
        if (handleBackupError(error, res)) {
            return;
        }
        next(error);
    }
});

settingsRouter.post("/backup/run", async (_req, res, next) => {
    try {
        const result = await runBackupNow("manual");
        res.status(201).json(result);
    } catch (error) {
        if (handleBackupError(error, res)) {
            return;
        }

        next(error);
    }
});

settingsRouter.post("/backup/smb/test", validate({ body: smbTestSchema }), async (req, res, next) => {
    try {
        await testSmbConnection(req.body);
        res.json({ message: "Connessione al NAS riuscita" });
    } catch (error) {
        if (handleBackupError(error, res)) {
            return;
        }

        next(error);
    }
});

settingsRouter.get("/email", async (_req, res, next) => {
    try {
        const settings = await getEmailSettings();
        res.json(settings);
    } catch (error) {
        if (handleEmailError(error, res)) {
            return;
        }
        next(error);
    }
});

settingsRouter.put("/email", validate({ body: emailSettingsSchema }), async (req, res, next) => {
    try {
        const settings = await updateEmailSettings(req.body);
        res.json(settings);
    } catch (error) {
        if (handleEmailError(error, res)) {
            return;
        }
        next(error);
    }
});

settingsRouter.post("/email/test", validate({ body: emailTestSchema }), async (req, res, next) => {
    try {
        await testEmailConnection(req.body);
        res.json({ message: `Email di prova inviata con successo a ${req.body.fromEmail}` });
    } catch (error) {
        if (handleEmailError(error, res)) {
            return;
        }
        next(error);
    }
});

settingsRouter.get("/logo", async (_req, res, next) => {
    try {
        const status = await getLogoStatus();
        res.json(status);
    } catch (error) {
        if (handleLogoError(error, res)) {
            return;
        }
        next(error);
    }
});

settingsRouter.post("/logo", logoUpload.single("logo"), async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: "Nessun file caricato" });
            return;
        }

        const status = await saveLogo(req.file.buffer, req.file.mimetype);
        res.status(201).json(status);
    } catch (error) {
        if (handleLogoError(error, res)) {
            return;
        }
        next(error);
    }
});

settingsRouter.delete("/logo", async (_req, res, next) => {
    try {
        const status = await resetLogo();
        res.json(status);
    } catch (error) {
        if (handleLogoError(error, res)) {
            return;
        }
        next(error);
    }
});

settingsRouter.get("/backup/list", async (_req, res, next) => {
    try {
        const dumps = await listBackupDumps();
        res.json(dumps);
    } catch (error) {
        if (handleBackupError(error, res)) {
            return;
        }
        next(error);
    }
});

settingsRouter.get("/backup/download/:fileName", async (req, res, next) => {
    try {
        const filePath = await getBackupDumpPath(req.params.fileName);

        res.download(filePath, path.basename(filePath), (error) => {
            if (error && !res.headersSent) {
                res.status(404).json({ message: "File di dump non trovato" });
            }
        });
    } catch (error) {
        if (handleBackupError(error, res)) {
            return;
        }
        next(error);
    }
});

settingsRouter.get("/update", async (_req, res, next) => {
    try {
        const status = await getUpdateStatus();
        res.json(status);
    } catch (error) {
        if (handleUpdateError(error, res)) {
            return;
        }
        next(error);
    }
});

settingsRouter.post("/update/run", async (_req, res, next) => {
    try {
        const status = await requestUpdate();
        res.status(202).json(status);
    } catch (error) {
        if (handleUpdateError(error, res)) {
            return;
        }
        next(error);
    }
});

settingsRouter.post("/update/check", async (_req, res, next) => {
    try {
        const status = await requestUpdateCheck();
        res.status(202).json(status);
    } catch (error) {
        if (handleUpdateError(error, res)) {
            return;
        }
        next(error);
    }
});

export default settingsRouter;
