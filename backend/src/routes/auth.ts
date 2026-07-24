import { Router, type Response } from "express";
import { z } from "zod";
import {
    AuthManagerError,
    changeOwnPassword,
    deleteSession,
    login,
} from "../services/authManager";
import { requireAuth, sessionCookieName, sessionCookieOptions } from "../middleware/requireAuth";
import { validate } from "./validation";

const authRouter = Router();

const sessionMaxAgeMs = 30 * 24 * 60 * 60 * 1000;

const handleAuthError = (error: unknown, res: Response) => {
    if (error instanceof AuthManagerError) {
        res.locals.apiErrorMessage = error.message;
        res.status(error.statusCode).json({ message: error.message });
        return true;
    }

    return false;
};

const loginBodySchema = z.object({
    username: z.string().trim().min(1).max(50),
    password: z.string().min(1).max(512),
}).strict();

const passwordBodySchema = z.object({
    currentPassword: z.string().min(1).max(512),
    newPassword: z.string().min(8).max(512),
}).strict();

authRouter.post("/login", validate({ body: loginBodySchema }), async (req, res, next) => {
    try {
        const { username, password } = req.body as { username: string; password: string };
        const { token, user } = await login(username, password, req.ip ?? "unknown");

        res.cookie(sessionCookieName, token, { ...sessionCookieOptions, maxAge: sessionMaxAgeMs });
        res.json(user);
    } catch (error) {
        if (handleAuthError(error, res)) {
            return;
        }
        next(error);
    }
});

authRouter.post("/logout", requireAuth, async (req, res, next) => {
    try {
        const token = req.cookies?.[sessionCookieName] as string | undefined;
        if (token) {
            await deleteSession(token);
        }
        res.clearCookie(sessionCookieName, sessionCookieOptions);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

authRouter.get("/me", requireAuth, (req, res) => {
    res.json(req.user);
});

authRouter.put("/password", requireAuth, validate({ body: passwordBodySchema }), async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
        const currentToken = req.cookies?.[sessionCookieName] as string;
        await changeOwnPassword(req.user!.id, currentPassword, newPassword, currentToken);
        res.status(204).send();
    } catch (error) {
        if (handleAuthError(error, res)) {
            return;
        }
        next(error);
    }
});

export default authRouter;
