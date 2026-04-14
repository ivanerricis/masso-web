import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import reportsRouter from "./routes/reports";
import customersRouter from "./routes/customers";
import collaboratorsRouter from "./routes/collaborators";
import techniciansRouter from "./routes/technicians";
import devicesRouter from "./routes/devices";
import issuesRouter from "./routes/issues";
import reportTechniciansRouter from "./routes/reportTechnicians";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/assets", express.static(path.join(process.cwd(), "public")));

app.use("/api/reports", reportsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/collaborators", collaboratorsRouter);
app.use("/api/technicians", techniciansRouter);
app.use("/api/devices", devicesRouter);
app.use("/api/issues", issuesRouter);
app.use("/api/report-technicians", reportTechniciansRouter);

app.get("/api/health", (_, res) => {
    res.json({ status: "ok" });
});

const findPgError = (error: unknown): { code?: string; detail?: string; message?: string } => {
    const visited = new Set<object>();
    let current: unknown = error;

    while (current && typeof current === "object") {
        if (visited.has(current)) {
            break;
        }

        visited.add(current);

        const candidate = current as { code?: string; detail?: string; message?: string; cause?: unknown };

        if (candidate.code || candidate.detail) {
            return {
                code: candidate.code,
                detail: candidate.detail,
                message: candidate.message,
            };
        }

        current = candidate.cause;
    }

    const fallback = error as { message?: string };
    return { message: fallback?.message };
};

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const { code, detail, message } = findPgError(error);

    if (code === "23505") {
        res.status(409).json({ message: detail ?? "Valore duplicato" });
        return;
    }

    if (code === "23503") {
        res.status(400).json({ message: detail ?? "Riferimento non valido" });
        return;
    }

    if (code === "23502") {
        res.status(400).json({ message: detail ?? "Campo obbligatorio mancante" });
        return;
    }

    console.error(error);
    res.status(500).json({ message: detail ?? message ?? "Internal server error" });
});

app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on port 3000");
});