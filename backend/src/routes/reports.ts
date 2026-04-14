import { Router } from "express";
import { eq } from "drizzle-orm";
import puppeteer from "puppeteer";
import { z } from "zod";
import {
    createReport,
    deleteReportById,
    getReportById,
    listReports,
    updateReportById,
} from "../db/queries/report";
import { db } from "../db";
import {
    customerTable,
    deviceTable,
    reportTable,
} from "../db/schema";
import { buildReportPrintHtml } from "../templates/reportPrintTemplate";
import { validate } from "./validation";

const reportsRouter = Router();

const reportIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const reportCreateBodySchema = z
    .object({
        deviceId: z.coerce.number().int().positive(),
        issueId: z.coerce.number().int().positive(),
        collaboratorId: z.coerce.number().int().positive().nullable().optional(),
        customerId: z.coerce.number().int().positive(),
        note: z.string().trim().min(1).max(255).nullable().optional(),
        password: z.string().trim().min(1).max(255).nullable().optional(),
        issueDescription: z.string().trim().min(1).max(255).nullable().optional(),
        serviceDescription: z.string().trim().min(1).max(255).nullable().optional(),
        dataBackup: z.boolean().optional(),
        charger: z.boolean().optional(),
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

reportsRouter.get("/:id/print", validate({ params: reportIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };

    const reportRows = await db
        .select({
            id: reportTable.id,
            note: reportTable.note,
            password: reportTable.password,
            issueDescription: reportTable.issueDescription,
            dataBackup: reportTable.dataBackup,
            charger: reportTable.charger,
            createdAt: reportTable.created_at,
            customerFirstName: customerTable.firstName,
            customerLastName: customerTable.lastName,
            customerPhone: customerTable.phoneNumber,
            deviceName: deviceTable.name,
        })
        .from(reportTable)
        .innerJoin(customerTable, eq(customerTable.id, reportTable.customerId))
        .innerJoin(deviceTable, eq(deviceTable.id, reportTable.deviceId))
        .where(eq(reportTable.id, id));

    if (reportRows.length === 0) {
        res.status(404).json({ message: "Report not found" });
        return;
    }

    const report = reportRows[0];
    const customerName = `${report.customerFirstName} ${report.customerLastName ?? ""}`.trim();
    const labName = process.env.LAB_NAME ?? "Masso";
    const labEmail = process.env.LAB_EMAIL ?? "info@masso.local";
    const labAddress = process.env.LAB_ADDRESS ?? "Indirizzo laboratorio";
    const labPhone = process.env.LAB_PHONE ?? "+39 000 000 0000";
    const labLogoUrl = process.env.LAB_LOGO_URL ?? "http://localhost:3000/assets/logo.jpg";

    const html = buildReportPrintHtml({
        id: report.id,
        labName,
        labEmail,
        labAddress,
        labPhone,
        labLogoUrl,
        customerName,
        customerPhone: report.customerPhone ?? "N/D",
        deviceName: report.deviceName,
        issueDescription: report.issueDescription ?? "-",
        note: report.note ?? "-",
        password: report.password ?? "-",
        dataBackup: report.dataBackup,
        charger: report.charger,
        createdAtLabel: new Intl.DateTimeFormat("it-IT", {
            dateStyle: "medium",
        }).format(report.createdAt),
    });

    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "0mm",
                right: "0mm",
                bottom: "0mm",
                left: "0mm",
            },
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=report-${id}.pdf`);
        res.send(pdfBuffer);
    } finally {
        await browser.close();
    }
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
