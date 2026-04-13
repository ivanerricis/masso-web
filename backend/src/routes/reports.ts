import { Router } from "express";
import { z } from "zod";
import {
    createReport,
    deleteReportById,
    getReportById,
    listReports,
    updateReportById,
} from "../db/queries/report";
import { validate } from "./validation";

const reportsRouter = Router();

const reportIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const reportCreateBodySchema = z
    .object({
        deviceId: z.coerce.number().int().positive(),
        issueId: z.coerce.number().int().positive(),
        collaboratorId: z.coerce.number().int().positive(),
        customerId: z.coerce.number().int().positive(),
        note: z.string().trim().min(1).max(255).nullable().optional(),
        issueDescription: z.string().trim().min(1).max(255).nullable().optional(),
        serviceDescription: z.string().trim().min(1).max(255).nullable().optional(),
        dataBackup: z.boolean().optional(),
        closed: z.boolean().optional(),
        toInvoice: z.boolean().optional(),
        price: z.coerce.number().int().min(0).optional(),
    })
    .strict();

const reportUpdateBodySchema = reportCreateBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
});

reportsRouter.get("/", async (_, res) => {
    const reports = await listReports();

    res.json(reports);
});

reportsRouter.get("/:id", validate({ params: reportIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const report = await getReportById(id);

    if (report.length === 0) {
        res.status(404).json({ message: "Report not found" });
        return;
    }

    res.json(report[0]);
});

reportsRouter.post("/", validate({ body: reportCreateBodySchema }), async (req, res) => {
    const createdReport = await createReport(req.body);

    res.status(201).json(createdReport[0]);
});

reportsRouter.put(
    "/:id",
    validate({ params: reportIdParamsSchema, body: reportUpdateBodySchema }),
    async (req, res) => {
        const { id } = req.params as unknown as { id: number };
        const updatedReport = await updateReportById(id, req.body);

        if (updatedReport.length === 0) {
            res.status(404).json({ message: "Report not found" });
            return;
        }

        res.json(updatedReport[0]);
    }
);

reportsRouter.delete("/:id", validate({ params: reportIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const deletedReport = await deleteReportById(id);

    if (deletedReport.length === 0) {
        res.status(404).json({ message: "Report not found" });
        return;
    }

    res.json(deletedReport[0]);
});

export default reportsRouter;
