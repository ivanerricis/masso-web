import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "node:path";
import reportsRouter from "./routes/reports";
import customersRouter from "./routes/customers";
import collaboratorsRouter from "./routes/collaborators";
import techniciansRouter from "./routes/technicians";
import devicesRouter from "./routes/devices";
import issuesRouter from "./routes/issues";
import reportTechniciansRouter from "./routes/reportTechnicians";
import interventionsRouter from "./routes/interventions";
import notificationsRouter from "./routes/notifications";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import { userActionLogger } from "./middleware/userActionLogger";
import { errorHandler } from "./middleware/errorHandler";
import { requireAdmin, requireAuth, requirePasswordChangeCompleted } from "./middleware/requireAuth";
import settingsRouter from "./routes/settings";
import { startBackupScheduler, stopBackupScheduler } from "./services/backupManager";
import { getLogoFile } from "./services/logoManager";
import { ensureDefaultAdmin, startSessionCleanupScheduler, stopSessionCleanupScheduler } from "./services/authManager";
import { pool } from "./db";
import { requestLogger } from "./middleware/requestLogger";

const app = express();

// `trust proxy` non può restare `true`: significherebbe accettare come veritiero
// qualunque `X-Forwarded-For` in arrivo, e quindi lasciar scegliere al chiamante quale IP
// far vedere al limitatore dei tentativi di login. L'unico hop di cui ci fidiamo è nginx
// del container frontend, che è anche l'unico a poter raggiungere il backend. L'IP reale
// del client si ricava da `CF-Connecting-IP` (vedi middleware/clientIp.ts).
app.set("trust proxy", 1);
app.use(requestLogger);

// In produzione frontend e backend sono la stessa origin — nginx fa da proxy su /api e
// /assets — quindi non esiste nessuna richiesta cross-origin e il CORS non serve: non
// attivarlo è più sicuro che configurarlo, e toglie di mezzo l'unico valore che sarebbe
// andato aggiornato a ogni cambio di dominio. Resta attivabile in sviluppo, dove Vite gira
// su :5173 e chiama il backend su :3000, elencando le origin ammesse in CORS_ORIGIN.
const corsOrigins = process.env.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

if (corsOrigins?.length) {
    app.use(cors({ origin: corsOrigins, credentials: true }));
}

app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.get("/assets/logo.jpg", async (_req, res) => {
    const { filePath, mimeType } = await getLogoFile();
    res.setHeader("Cache-Control", "no-store");
    res.type(mimeType);
    res.sendFile(filePath);
});
app.use("/assets", express.static(path.join(process.cwd(), "public")));
app.use(userActionLogger);

app.get("/api/health", (_, res) => {
    res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);

app.use("/api", requireAuth, requirePasswordChangeCompleted);

app.use("/api/users", requireAdmin, usersRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/collaborators", collaboratorsRouter);
app.use("/api/technicians", techniciansRouter);
app.use("/api/devices", devicesRouter);
app.use("/api/issues", issuesRouter);
app.use("/api/report-technicians", reportTechniciansRouter);
app.use("/api/interventions", interventionsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/settings", settingsRouter);

app.use(errorHandler);

const server = app.listen(3000, "0.0.0.0", () => {
    startBackupScheduler();
    startSessionCleanupScheduler();
    // Il `.catch` non è decorativo: senza, un errore qui diventa una rejection non
    // gestita e su Node 24 abbatte il processo appena avviato. In produzione il
    // database è già sano (depends_on: service_healthy), ma un intoppo momentaneo non
    // deve impedire al server di restare in piedi — l'admin verrà creato al riavvio.
    void ensureDefaultAdmin().catch((error: unknown) => {
        console.error("Creazione dell'utente amministratore iniziale non riuscita:", error);
    });
    console.log("Server running on port 3000");
});

/**
 * L'aggiornamento automatico ricrea i container (`docker compose up --build`), quindi il
 * backend riceve SIGTERM a intervalli regolari, non solo in casi eccezionali. Senza
 * questo handler Docker attende 10s e poi manda SIGKILL: le richieste in volo (un
 * download PDF, una scrittura di backup) vengono troncate e le connessioni al database
 * chiuse di colpo. Qui invece smettiamo di accettare connessioni, lasciamo terminare le
 * richieste già iniziate e chiudiamo il pool.
 */
const shutdownTimeoutMs = 10 * 1000;
let shuttingDown = false;

const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    console.log(`Ricevuto ${signal}, arresto in corso...`);

    stopBackupScheduler();
    stopSessionCleanupScheduler();

    // Se una richiesta resta appesa non possiamo aspettarla all'infinito: Docker manderebbe
    // comunque SIGKILL. Meglio forzare noi l'uscita dopo il timeout, dopo aver almeno
    // provato a chiudere il pool.
    const forceExitTimer = setTimeout(() => {
        console.error("Arresto forzato: richieste ancora in corso allo scadere del timeout.");
        process.exit(1);
    }, shutdownTimeoutMs);
    forceExitTimer.unref();

    server.close((error) => {
        void (async () => {
            if (error) {
                console.error("Errore durante la chiusura del server HTTP:", error);
            }

            try {
                await pool.end();
            } catch (poolError) {
                console.error("Errore durante la chiusura del pool database:", poolError);
            }

            clearTimeout(forceExitTimer);
            console.log("Arresto completato.");
            process.exit(error ? 1 : 0);
        })();
    });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
