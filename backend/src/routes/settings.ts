import { type Response, Router } from "express";
import { z } from "zod";
import { validate } from "./validation";
import {
    BackupManagerError,
    getBackupSettings,
    runBackupNow,
    updateBackupSettings,
} from "../services/backupManager";

const settingsRouter = Router();

const handleBackupError = (error: unknown, res: Response) => {
    if (error instanceof BackupManagerError) {
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

export default settingsRouter;
