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
    updateBackupSettings,
} from "../services/backupManager";
import { LogoManagerError, getLogoStatus, resetLogo, saveLogo } from "../services/logoManager";
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

const backupSettingsSchema = z.object({
    dumpEnabled: z.boolean(),
    autoEnabled: z.boolean(),
    frequencyDays: z.coerce.number().int().min(1).max(365),
    runAt: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    outputDir: z.string().trim().min(1).max(512),
    maxBackupsToKeep: z.coerce.number().int().min(1).max(365),
}).strict();

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
