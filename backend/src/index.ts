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
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import { userActionLogger } from "./middleware/userActionLogger";
import { errorHandler } from "./middleware/errorHandler";
import { requireAuth, requirePasswordChangeCompleted } from "./middleware/requireAuth";
import settingsRouter from "./routes/settings";
import { startBackupScheduler } from "./services/backupManager";
import { getLogoFile } from "./services/logoManager";
import { ensureDefaultAdmin } from "./services/authManager";

const app = express();

app.set("trust proxy", true);
app.use(cors({ origin: true, credentials: true }));
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

app.use("/api/users", usersRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/collaborators", collaboratorsRouter);
app.use("/api/technicians", techniciansRouter);
app.use("/api/devices", devicesRouter);
app.use("/api/issues", issuesRouter);
app.use("/api/report-technicians", reportTechniciansRouter);
app.use("/api/interventions", interventionsRouter);
app.use("/api/settings", settingsRouter);

app.use(errorHandler);

app.listen(3000, "0.0.0.0", () => {
    startBackupScheduler();
    void ensureDefaultAdmin();
    console.log("Server running on port 3000");
});