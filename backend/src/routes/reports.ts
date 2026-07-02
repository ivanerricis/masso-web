import { Router } from "express";
import { eq } from "drizzle-orm";
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
import { createReportPdfBuffer } from "../services/reportPdf";
import { validate } from "./validation";

const reportsRouter = Router();
const reportPaymentMethods = ["non_paid", "cash", "card"] as const;
type ReportPaymentMethod = (typeof reportPaymentMethods)[number];
const paidPaymentMethods = new Set<ReportPaymentMethod>(["cash", "card"]);

const reportIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const reportBodySchema = z
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
        paymentMethod: z.enum(reportPaymentMethods).optional(),
        price: z.coerce.number().int().min(0).optional(),
    })
    .strict();

const reportCreateBodySchema = reportBodySchema.refine(
    (value) => {
        const paymentMethod = value.paymentMethod ?? "non_paid";
        const price = value.price ?? 0;

        return !paidPaymentMethods.has(paymentMethod) || price > 0;
    },
    {
        message: "Se il pagamento è in contanti o con carta, il prezzo deve essere maggiore di 0",
        path: ["price"],
    }
);

const reportUpdateBodySchema = reportBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
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
            customerPhoneSecondary: customerTable.phoneNumberSecondary,
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
    const configuredLogoUrl = process.env.LAB_LOGO_URL ?? "/assets/logo.jpg";
    const labLogoUrl = configuredLogoUrl.startsWith("http://") || configuredLogoUrl.startsWith("https://")
        ? configuredLogoUrl
        : `${req.protocol}://${req.get("host")}${configuredLogoUrl.startsWith("/") ? configuredLogoUrl : `/${configuredLogoUrl}`}`;
    const customerPhonePrimary = report.customerPhone?.trim() ?? "";
    const customerPhoneSecondary = report.customerPhoneSecondary?.trim() ?? "";
    const customerPhoneLabel = customerPhonePrimary && customerPhoneSecondary
        ? `${customerPhonePrimary} - ${customerPhoneSecondary}`
        : customerPhonePrimary || customerPhoneSecondary || "N/D";

    const pdfBuffer = await createReportPdfBuffer({
        id: report.id,
        labName,
        labEmail,
        labAddress,
        labPhone,
        labLogoUrl,
        customerName,
        customerPhone: customerPhoneLabel,
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

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=report-${id}.pdf`);
    res.send(pdfBuffer);
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
    const paymentMethod = (req.body.paymentMethod ?? "non_paid") as ReportPaymentMethod;
    const price = req.body.price ?? 0;

    if (paidPaymentMethods.has(paymentMethod) && price <= 0) {
        res.status(400).json({ message: "Se il pagamento è in contanti o con carta, il prezzo deve essere maggiore di 0" });
        return;
    }

    const createdReport = await createReport({
        ...req.body,
        paymentMethod,
        price,
    });

    res.status(201).json(createdReport[0]);
});

reportsRouter.put(
    "/:id",
    validate({ params: reportIdParamsSchema, body: reportUpdateBodySchema }),
    async (req, res) => {
        const { id } = req.params as unknown as { id: number };
        const existingReport = await getReportById(id);

        if (existingReport.length === 0) {
            res.status(404).json({ message: "Report not found" });
            return;
        }

        const nextPaymentMethod = (req.body.paymentMethod ?? existingReport[0].paymentMethod) as ReportPaymentMethod;
        const nextPrice = req.body.price ?? existingReport[0].price;

        if (paidPaymentMethods.has(nextPaymentMethod) && nextPrice <= 0) {
            res.status(400).json({ message: "Se il pagamento è in contanti o con carta, il prezzo deve essere maggiore di 0" });
            return;
        }

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
