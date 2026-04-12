import { Router } from "express";
import {
    createReportTechnician,
    deleteReportTechnicianByIds,
    getReportTechnicianByIds,
    listReportTechnicians,
    updateReportTechnicianByIds,
} from "../db/queries/reportTechnician";
import { parseId } from "./utils";

const reportTechniciansRouter = Router();

reportTechniciansRouter.get("/", async (_, res) => {
    const reportTechnicians = await listReportTechnicians();

    res.json(reportTechnicians);
});

reportTechniciansRouter.get("/:reportId/:technicianId", async (req, res) => {
    const reportId = parseId(req.params.reportId);
    const technicianId = parseId(req.params.technicianId);

    if (!reportId || !technicianId) {
        res.status(400).json({ message: "Invalid report technician ids" });
        return;
    }

    const reportTechnician = await getReportTechnicianByIds(reportId, technicianId);

    if (reportTechnician.length === 0) {
        res.status(404).json({ message: "Report technician not found" });
        return;
    }

    res.json(reportTechnician[0]);
});

reportTechniciansRouter.post("/", async (req, res) => {
    const createdReportTechnician = await createReportTechnician(req.body);

    res.status(201).json(createdReportTechnician[0]);
});

reportTechniciansRouter.put("/:reportId/:technicianId", async (req, res) => {
    const reportId = parseId(req.params.reportId);
    const technicianId = parseId(req.params.technicianId);

    if (!reportId || !technicianId) {
        res.status(400).json({ message: "Invalid report technician ids" });
        return;
    }

    const updatedReportTechnician = await updateReportTechnicianByIds(reportId, technicianId, req.body);

    if (updatedReportTechnician.length === 0) {
        res.status(404).json({ message: "Report technician not found" });
        return;
    }

    res.json(updatedReportTechnician[0]);
});

reportTechniciansRouter.delete("/:reportId/:technicianId", async (req, res) => {
    const reportId = parseId(req.params.reportId);
    const technicianId = parseId(req.params.technicianId);

    if (!reportId || !technicianId) {
        res.status(400).json({ message: "Invalid report technician ids" });
        return;
    }

    const deletedReportTechnician = await deleteReportTechnicianByIds(reportId, technicianId);

    if (deletedReportTechnician.length === 0) {
        res.status(404).json({ message: "Report technician not found" });
        return;
    }

    res.json(deletedReportTechnician[0]);
});

export default reportTechniciansRouter;
