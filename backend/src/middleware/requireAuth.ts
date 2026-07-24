import type { NextFunction, Request, Response } from "express";
import { getSessionUser, type PublicUser } from "../services/authManager";

export const sessionCookieName = "session";

// L'app gira su HTTP semplice in LAN (nessuna terminazione TLS), quindi `secure` resta false.
export const sessionCookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    path: "/",
};

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: PublicUser;
        }
    }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.[sessionCookieName] as string | undefined;

    if (!token) {
        res.status(401).json({ message: "Autenticazione richiesta" });
        return;
    }

    const user = await getSessionUser(token);

    if (!user) {
        res.clearCookie(sessionCookieName);
        res.status(401).json({ message: "Sessione scaduta o non valida" });
        return;
    }

    req.user = user;
    next();
};

// Da applicare dopo requireAuth sulle rotte diverse da /api/auth/*, che devono restare
// utilizzabili (login, logout, cambio password) anche quando la password va cambiata.
export const requirePasswordChangeCompleted = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.mustChangePassword) {
        res.status(403).json({ message: "Devi cambiare la password prima di continuare", mustChangePassword: true });
        return;
    }

    next();
};
