import { Router } from "express";
import {
    createReport,
    deleteReportById,
    getReportById,
    listReports,
    updateReportById,
} from "../db/queries/report";
import { parseId } from "./utils";

const reportsRouter = Router();

reportsRouter.get("/", async (_, res) => {
    const reports = await listReports();

    res.json(reports);
});

reportsRouter.get("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid report id" });
        return;
    }

    const report = await getReportById(id);

    if (report.length === 0) {
        res.status(404).json({ message: "Report not found" });
        return;
    }

    res.json(report[0]);
});

reportsRouter.post("/", async (req, res) => {
    const createdReport = await createReport(req.body);

    res.status(201).json(createdReport[0]);
});

reportsRouter.put("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid report id" });
        return;
    }

    const updatedReport = await updateReportById(id, req.body);

    if (updatedReport.length === 0) {
        res.status(404).json({ message: "Report not found" });
        return;
    }

    res.json(updatedReport[0]);
});

reportsRouter.delete("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid report id" });
        return;
    }

    const deletedReport = await deleteReportById(id);

    if (deletedReport.length === 0) {
        res.status(404).json({ message: "Report not found" });
        return;
    }

    res.json(deletedReport[0]);
});

export default reportsRouter;
