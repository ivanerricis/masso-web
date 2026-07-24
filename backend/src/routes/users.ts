import { Router, type Response } from "express";
import { z } from "zod";
import { AuthManagerError, createUser, deleteUser, listUsers, regeneratePassword, setUserActive } from "../services/authManager";
import { validate } from "./validation";

const usersRouter = Router();

const handleAuthError = (error: unknown, res: Response) => {
    if (error instanceof AuthManagerError) {
        res.locals.apiErrorMessage = error.message;
        res.status(error.statusCode).json({ message: error.message });
        return true;
    }

    return false;
};

const userIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const createUserBodySchema = z.object({
    username: z.string().trim().min(1).max(50),
}).strict();

usersRouter.get("/", async (_req, res, next) => {
    try {
        const users = await listUsers();
        res.json(users);
    } catch (error) {
        next(error);
    }
});

usersRouter.post("/", validate({ body: createUserBodySchema }), async (req, res, next) => {
    try {
        const { username } = req.body as { username: string };
        const result = await createUser(username);
        res.status(201).json(result);
    } catch (error) {
        if (handleAuthError(error, res)) {
            return;
        }
        next(error);
    }
});

usersRouter.post("/:id/regenerate-password", validate({ params: userIdParamsSchema }), async (req, res, next) => {
    try {
        const { id } = req.params as unknown as { id: number };
        const result = await regeneratePassword(id);
        res.json(result);
    } catch (error) {
        if (handleAuthError(error, res)) {
            return;
        }
        next(error);
    }
});

usersRouter.post("/:id/disable", validate({ params: userIdParamsSchema }), async (req, res, next) => {
    try {
        const { id } = req.params as unknown as { id: number };
        if (id === req.user!.id) {
            res.status(400).json({ message: "Non puoi disabilitare il tuo stesso account" });
            return;
        }

        const result = await setUserActive(id, false);
        res.json(result);
    } catch (error) {
        if (handleAuthError(error, res)) {
            return;
        }
        next(error);
    }
});

usersRouter.post("/:id/enable", validate({ params: userIdParamsSchema }), async (req, res, next) => {
    try {
        const { id } = req.params as unknown as { id: number };
        const result = await setUserActive(id, true);
        res.json(result);
    } catch (error) {
        if (handleAuthError(error, res)) {
            return;
        }
        next(error);
    }
});

usersRouter.delete("/:id", validate({ params: userIdParamsSchema }), async (req, res, next) => {
    try {
        const { id } = req.params as unknown as { id: number };
        if (id === req.user!.id) {
            res.status(400).json({ message: "Non puoi eliminare il tuo stesso account" });
            return;
        }

        await deleteUser(id);
        res.status(204).end();
    } catch (error) {
        if (handleAuthError(error, res)) {
            return;
        }
        next(error);
    }
});

export default usersRouter;
