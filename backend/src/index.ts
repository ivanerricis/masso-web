import express from "express";
import cors from "cors";
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

app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on port 3000");
});