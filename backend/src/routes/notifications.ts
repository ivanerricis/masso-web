import { Router } from "express";
import { z } from "zod";
import { validate } from "./validation";
import { dismissNotification, getActiveNotifications } from "../services/notificationManager";

const notificationsRouter = Router();

const notificationIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

notificationsRouter.get("/", async (_req, res, next) => {
    try {
        res.json(await getActiveNotifications());
    } catch (error) {
        next(error);
    }
});

// Chiusura condivisa: vale per tutti gli utenti. Idempotente, così due schede aperte
// sulla stessa notifica non si scambiano un 404.
notificationsRouter.post("/:id/dismiss", validate({ params: notificationIdParamsSchema }), async (req, res, next) => {
    try {
        await dismissNotification(Number(req.params.id));
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

export default notificationsRouter;
