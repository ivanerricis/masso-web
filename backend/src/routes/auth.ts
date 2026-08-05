import { Router } from "express";
import { z } from "zod";
import { changeOwnPassword, deleteSession, login } from "../services/authManager";
import { requireAuth, sessionCookieName, sessionCookieOptions } from "../middleware/requireAuth";
import { getClientIp } from "../middleware/clientIp";
import { isPasswordCompliant, passwordRequirementsMessage } from "../services/passwordPolicy";
import { validate } from "./validation";

const authRouter = Router();

const sessionMaxAgeMs = 30 * 24 * 60 * 60 * 1000;

const loginBodySchema = z
    .object({
        username: z.string().trim().min(1).max(50),
        password: z.string().min(1).max(512),
    })
    .strict();

const passwordBodySchema = z
    .object({
        currentPassword: z.string().min(1).max(512),
        newPassword: z.string().max(512).refine(isPasswordCompliant, { message: passwordRequirementsMessage }),
    })
    .strict();

authRouter.post("/login", validate({ body: loginBodySchema }), async (req, res) => {
    const { username, password } = req.body as { username: string; password: string };
    const { token, user } = await login(username, password, getClientIp(req));

    res.cookie(sessionCookieName, token, { ...sessionCookieOptions, maxAge: sessionMaxAgeMs });
    res.json(user);
});

authRouter.post("/logout", requireAuth, async (req, res) => {
    const token = req.cookies?.[sessionCookieName] as string | undefined;
    if (token) {
        await deleteSession(token);
    }
    res.clearCookie(sessionCookieName, sessionCookieOptions);
    res.status(204).send();
});

authRouter.get("/me", requireAuth, (req, res) => {
    res.json(req.user);
});

authRouter.put("/password", requireAuth, validate({ body: passwordBodySchema }), async (req, res) => {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    const currentToken = req.cookies?.[sessionCookieName] as string;

    await changeOwnPassword(req.user!.id, currentPassword, newPassword, currentToken);
    res.status(204).send();
});

export default authRouter;
