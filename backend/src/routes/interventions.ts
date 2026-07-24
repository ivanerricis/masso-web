import { type Response, Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
    createIntervention,
    deleteInterventionById,
    getInterventionById,
    listInterventions,
    updateInterventionById,
} from "../db/queries/intervention";
import { db } from "../db";
import { collaboratorTable, customerTable, interventionTable } from "../db/schema";
import { EmailManagerError, sendEmail } from "../services/emailManager";
import { createInterventionPdfBuffer } from "../services/interventionPdf";
import { validate } from "./validation";

const interventionsRouter = Router();

const interventionTypes = ["consegna_materiale", "intervento_sede", "intervento_remoto"] as const;
type InterventionType = (typeof interventionTypes)[number];
const onSiteInterventionTypes = new Set<InterventionType>(["intervento_sede", "intervento_remoto"]);

const interventionStatuses = ["programmato", "in_lavorazione", "completato"] as const;

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

const interventionIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const interventionListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(1000).optional(),
    search: z.string().trim().max(255).optional(),
    status: z.enum(["all", ...interventionStatuses]).optional(),
    type: z.enum(["all", ...interventionTypes]).optional(),
    date: z.string().regex(dateRegex).optional(),
});

const interventionBodySchema = z
    .object({
        type: z.enum(interventionTypes),
        description: z.string().trim().min(1).max(4000),
        status: z.enum(interventionStatuses).optional(),
        customerId: z.coerce.number().int().positive(),
        collaboratorId: z.coerce.number().int().positive(),
        interventionDate: z.string().regex(dateRegex).nullable().optional(),
        startTime: z.string().regex(timeRegex).nullable().optional(),
        endTime: z.string().regex(timeRegex).nullable().optional(),
    })
    .strict();

const interventionCreateBodySchema = interventionBodySchema.superRefine((value, ctx) => {
    if (!onSiteInterventionTypes.has(value.type)) {
        return;
    }

    if (!value.interventionDate) {
        ctx.addIssue({ code: "custom", message: "La data dell'intervento è obbligatoria", path: ["interventionDate"] });
    }

    if (!value.startTime) {
        ctx.addIssue({ code: "custom", message: "L'ora di inizio è obbligatoria", path: ["startTime"] });
    }

    if (!value.endTime) {
        ctx.addIssue({ code: "custom", message: "L'ora di fine è obbligatoria", path: ["endTime"] });
    }

    if (value.startTime && value.endTime && value.startTime >= value.endTime) {
        ctx.addIssue({ code: "custom", message: "L'ora di fine deve essere successiva all'ora di inizio", path: ["endTime"] });
    }
});

const interventionUpdateBodySchema = interventionBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
});

interventionsRouter.get("/", validate({ query: interventionListQuerySchema }), async (req, res) => {
    const { page, pageSize, search, status, type, date } = req.query as unknown as {
        page?: number;
        pageSize?: number;
        search?: string;
        status?: "all" | (typeof interventionStatuses)[number];
        type?: "all" | InterventionType;
        date?: string;
    };

    const interventions = await listInterventions({
        page,
        pageSize,
        search,
        status: status ?? "all",
        type: type ?? "all",
        date,
    });

    if (page == null || pageSize == null) {
        res.json(interventions);
        return;
    }

    if (Array.isArray(interventions)) {
        res.json(interventions);
        return;
    }

    const { items, totalItems } = interventions;

    res.json({
        items,
        totalItems,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    });
});

const loadInterventionPrintContext = async (id: number, req: { protocol: string; get: (name: string) => string | undefined }) => {
    const interventionRows = await db
        .select({
            id: interventionTable.id,
            type: interventionTable.type,
            description: interventionTable.description,
            status: interventionTable.status,
            interventionDate: interventionTable.interventionDate,
            startTime: interventionTable.startTime,
            endTime: interventionTable.endTime,
            createdAt: interventionTable.created_at,
            customerFirstName: customerTable.firstName,
            customerLastName: customerTable.lastName,
            customerPhone: customerTable.phoneNumber,
            customerPhoneSecondary: customerTable.phoneNumberSecondary,
            customerEmail: customerTable.email,
            collaboratorFirstName: collaboratorTable.firstName,
            collaboratorLastName: collaboratorTable.lastName,
        })
        .from(interventionTable)
        .innerJoin(customerTable, eq(customerTable.id, interventionTable.customerId))
        .innerJoin(collaboratorTable, eq(collaboratorTable.id, interventionTable.collaboratorId))
        .where(eq(interventionTable.id, id));

    if (interventionRows.length === 0) {
        return null;
    }

    const intervention = interventionRows[0];
    const customerName = `${intervention.customerFirstName} ${intervention.customerLastName ?? ""}`.trim();
    const collaboratorName = `${intervention.collaboratorFirstName} ${intervention.collaboratorLastName ?? ""}`.trim();
    const labName = process.env.LAB_NAME ?? "Masso";
    const labEmail = process.env.LAB_EMAIL ?? "info@masso.local";
    const labAddress = process.env.LAB_ADDRESS ?? "Indirizzo laboratorio";
    const labPhone = process.env.LAB_PHONE ?? "+39 000 000 0000";
    const configuredLogoUrl = process.env.LAB_LOGO_URL ?? "/assets/logo.jpg";
    const labLogoUrl = configuredLogoUrl.startsWith("http://") || configuredLogoUrl.startsWith("https://")
        ? configuredLogoUrl
        : `${req.protocol}://${req.get("host")}${configuredLogoUrl.startsWith("/") ? configuredLogoUrl : `/${configuredLogoUrl}`}`;
    const customerPhonePrimary = intervention.customerPhone?.trim() ?? "";
    const customerPhoneSecondary = intervention.customerPhoneSecondary?.trim() ?? "";
    const customerPhoneLabel = customerPhonePrimary && customerPhoneSecondary
        ? `${customerPhonePrimary} - ${customerPhoneSecondary}`
        : customerPhonePrimary || customerPhoneSecondary || "N/D";

    return {
        customerName,
        customerEmail: intervention.customerEmail?.trim() || null,
        labName,
        pdfData: {
            id: intervention.id,
            labName,
            labEmail,
            labAddress,
            labPhone,
            labLogoUrl,
            customerName,
            customerPhone: customerPhoneLabel,
            collaboratorName,
            type: intervention.type as InterventionType,
            status: intervention.status as (typeof interventionStatuses)[number],
            description: intervention.description,
            interventionDateLabel: intervention.interventionDate
                ? new Intl.DateTimeFormat("it-IT", { dateStyle: "medium" }).format(new Date(`${intervention.interventionDate}T00:00:00`))
                : null,
            startTime: intervention.startTime,
            endTime: intervention.endTime,
            createdAtLabel: new Intl.DateTimeFormat("it-IT", { dateStyle: "medium" }).format(intervention.createdAt),
        },
    };
};

const handleEmailError = (error: unknown, res: Response) => {
    if (error instanceof EmailManagerError) {
        res.status(error.statusCode).json({ message: error.message });
        return true;
    }

    return false;
};

interventionsRouter.get("/:id/print", validate({ params: interventionIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };

    const context = await loadInterventionPrintContext(id, req);

    if (!context) {
        res.status(404).json({ message: "Intervento non trovato" });
        return;
    }

    const pdfBuffer = await createInterventionPdfBuffer(context.pdfData);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=intervento-${id}.pdf`);
    res.send(pdfBuffer);
});

interventionsRouter.post("/:id/send-email", validate({ params: interventionIdParamsSchema }), async (req, res, next) => {
    const { id } = req.params as unknown as { id: number };

    try {
        const context = await loadInterventionPrintContext(id, req);

        if (!context) {
            res.status(404).json({ message: "Intervento non trovato" });
            return;
        }

        if (!context.customerEmail) {
            res.status(400).json({ message: "Il cliente non ha un indirizzo email configurato" });
            return;
        }

        const pdfBuffer = await createInterventionPdfBuffer(context.pdfData);

        await sendEmail({
            to: context.customerEmail,
            subject: `Intervento #${id} - ${context.labName}`,
            text: `Gentile ${context.customerName},\n\nin allegato trova il riepilogo dell'intervento #${id}.\n\nCordiali saluti,\n${context.labName}`,
            attachment: {
                filename: `intervento-${id}.pdf`,
                content: pdfBuffer,
            },
        });

        res.json({ message: "Email inviata con successo" });
    } catch (error) {
        if (handleEmailError(error, res)) {
            return;
        }
        next(error);
    }
});

interventionsRouter.get("/:id", validate({ params: interventionIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const intervention = await getInterventionById(id);

    if (intervention.length === 0) {
        res.status(404).json({ message: "Intervento non trovato" });
        return;
    }

    res.json(intervention[0]);
});

interventionsRouter.post("/", validate({ body: interventionCreateBodySchema }), async (req, res) => {
    const isOnSite = onSiteInterventionTypes.has(req.body.type);

    const createdIntervention = await createIntervention({
        type: req.body.type,
        description: req.body.description,
        status: req.body.status ?? "programmato",
        customerId: req.body.customerId,
        collaboratorId: req.body.collaboratorId,
        interventionDate: isOnSite ? req.body.interventionDate ?? null : null,
        startTime: isOnSite ? req.body.startTime ?? null : null,
        endTime: isOnSite ? req.body.endTime ?? null : null,
    });

    res.status(201).json(createdIntervention[0]);
});

interventionsRouter.put(
    "/:id",
    validate({ params: interventionIdParamsSchema, body: interventionUpdateBodySchema }),
    async (req, res) => {
        const { id } = req.params as unknown as { id: number };
        const existingRows = await getInterventionById(id);

        if (existingRows.length === 0) {
            res.status(404).json({ message: "Intervento non trovato" });
            return;
        }

        const existing = existingRows[0];
        const nextType = (req.body.type ?? existing.type) as InterventionType;
        const isOnSite = onSiteInterventionTypes.has(nextType);
        const nextInterventionDate = "interventionDate" in req.body ? req.body.interventionDate ?? null : existing.interventionDate;
        const nextStartTime = "startTime" in req.body ? req.body.startTime ?? null : existing.startTime;
        const nextEndTime = "endTime" in req.body ? req.body.endTime ?? null : existing.endTime;

        if (isOnSite && (!nextInterventionDate || !nextStartTime || !nextEndTime)) {
            res.status(400).json({ message: "Per interventi in sede o da remoto sono richiesti data, ora inizio e ora fine" });
            return;
        }

        if (isOnSite && nextStartTime && nextEndTime && nextStartTime >= nextEndTime) {
            res.status(400).json({ message: "L'ora di fine deve essere successiva all'ora di inizio" });
            return;
        }

        const updatedIntervention = await updateInterventionById(id, {
            ...req.body,
            interventionDate: isOnSite ? nextInterventionDate : null,
            startTime: isOnSite ? nextStartTime : null,
            endTime: isOnSite ? nextEndTime : null,
        });

        if (updatedIntervention.length === 0) {
            res.status(404).json({ message: "Intervento non trovato" });
            return;
        }

        res.json(updatedIntervention[0]);
    }
);

interventionsRouter.delete("/:id", validate({ params: interventionIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const deletedIntervention = await deleteInterventionById(id);

    if (deletedIntervention.length === 0) {
        res.status(404).json({ message: "Intervento non trovato" });
        return;
    }

    res.json(deletedIntervention[0]);
});

export default interventionsRouter;
