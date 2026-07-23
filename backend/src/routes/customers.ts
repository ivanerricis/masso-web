import { Router } from "express";
import { z } from "zod";
import {
    createCustomer,
    deleteCustomerById,
    getCustomerById,
    listCustomers,
    updateCustomerById,
} from "../db/queries/customer";
import { listReports } from "../db/queries/report";
import { listInterventions } from "../db/queries/intervention";
import { createCustomerReportsPdfBuffer } from "../services/reportPdf";
import { createCustomerInterventionsPdfBuffer } from "../services/interventionPdf";
import { validate } from "./validation";

const customersRouter = Router();

const customerIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const customerListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(1000).optional(),
    search: z.string().trim().max(255).optional(),
});

const customerBodySchemaBase = z.object({
    email: z.string().trim().email().max(255).nullable().optional(),
    firstName: z.string().trim().min(1).max(255),
    lastName: z.string().trim().min(1).max(255).nullable().optional(),
    phoneNumber: z.string().trim().min(1).max(20).nullable().optional(),
    phoneNumberSecondary: z.string().trim().min(1).max(20).nullable().optional(),
});

const customerCreateBodySchema = customerBodySchemaBase
    .refine((value) => value.phoneNumber != null || value.phoneNumberSecondary != null, {
        message: "At least one phone number is required",
        path: ["phoneNumber"],
    })
    .strict();

const customerUpdateBodySchema = customerBodySchemaBase
    .partial()
    .refine(
        (value) => {
            if (!("phoneNumber" in value) && !("phoneNumberSecondary" in value)) {
                return true;
            }

            return value.phoneNumber != null || value.phoneNumberSecondary != null;
        },
        {
            message: "At least one phone number is required",
            path: ["phoneNumber"],
        }
    )
    .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required",
    });

customersRouter.get("/", validate({ query: customerListQuerySchema }), async (req, res) => {
    const { page, pageSize, search } = req.query as unknown as {
        page?: number;
        pageSize?: number;
        search?: string;
    };

    const customers = await listCustomers({ page, pageSize, search });

    if (page == null || pageSize == null) {
        res.json(customers);
        return;
    }

    if (Array.isArray(customers)) {
        res.json(customers);
        return;
    }

    const { items, totalItems } = customers;

    res.json({
        items,
        totalItems,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    });
});

customersRouter.get("/:id", validate({ params: customerIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const customers = await getCustomerById(id);

    if (customers.length === 0) {
        res.status(404).json({ message: "Customer not found" });
        return;
    }

    res.json(customers[0]);
});

customersRouter.get("/:id/reports/print", validate({ params: customerIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const customers = await getCustomerById(id);

    if (customers.length === 0) {
        res.status(404).json({ message: "Customer not found" });
        return;
    }

    const [customer] = customers;
    const reportsResult = await listReports({ customerId: id });
    const reports = Array.isArray(reportsResult) ? reportsResult : reportsResult.items;
    const customerName = `${customer.firstName} ${customer.lastName ?? ""}`.trim();
    const customerPhonePrimary = customer.phoneNumber?.trim() ?? "";
    const customerPhoneSecondary = customer.phoneNumberSecondary?.trim() ?? "";
    const customerPhone =
        customerPhonePrimary && customerPhoneSecondary
            ? `${customerPhonePrimary} - ${customerPhoneSecondary}`
            : customerPhonePrimary || customerPhoneSecondary || "N/D";
    const labName = process.env.LAB_NAME ?? "Masso";
    const labEmail = process.env.LAB_EMAIL ?? "info@masso.local";
    const labAddress = process.env.LAB_ADDRESS ?? "Indirizzo laboratorio";
    const labPhone = process.env.LAB_PHONE ?? "+39 000 000 0000";
    const configuredLogoUrl = process.env.LAB_LOGO_URL ?? "/assets/logo.jpg";
    const labLogoUrl = configuredLogoUrl.startsWith("http://") || configuredLogoUrl.startsWith("https://")
        ? configuredLogoUrl
        : `${req.protocol}://${req.get("host")}${configuredLogoUrl.startsWith("/") ? configuredLogoUrl : `/${configuredLogoUrl}`}`;

    const pdfBuffer = await createCustomerReportsPdfBuffer({
        customerId: customer.id,
        customerName,
        customerPhone,
        customerEmail: customer.email ?? "-",
        labName,
        labEmail,
        labAddress,
        labPhone,
        labLogoUrl,
        reportCount: reports.length,
        reports: reports.map((report) => ({
            id: report.id,
            createdAtLabel: new Intl.DateTimeFormat("it-IT", {
                dateStyle: "medium",
            }).format(report.createdAt),
            deviceName: report.device,
            issueDescription: report.issue,
            closed: report.closed,
            alerted: report.alerted,
            paymentMethod: report.paymentMethod as "non_paid" | "cash" | "card",
            totalPrice: report.totalPrice,
        })),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=customer-${id}-reports.pdf`);
    res.send(pdfBuffer);
});

customersRouter.get("/:id/interventions/print", validate({ params: customerIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const customers = await getCustomerById(id);

    if (customers.length === 0) {
        res.status(404).json({ message: "Customer not found" });
        return;
    }

    const [customer] = customers;
    const interventionsResult = await listInterventions({ customerId: id });
    const interventions = Array.isArray(interventionsResult) ? interventionsResult : interventionsResult.items;
    const customerName = `${customer.firstName} ${customer.lastName ?? ""}`.trim();
    const customerPhonePrimary = customer.phoneNumber?.trim() ?? "";
    const customerPhoneSecondary = customer.phoneNumberSecondary?.trim() ?? "";
    const customerPhone =
        customerPhonePrimary && customerPhoneSecondary
            ? `${customerPhonePrimary} - ${customerPhoneSecondary}`
            : customerPhonePrimary || customerPhoneSecondary || "N/D";
    const labName = process.env.LAB_NAME ?? "Masso";
    const labEmail = process.env.LAB_EMAIL ?? "info@masso.local";
    const labAddress = process.env.LAB_ADDRESS ?? "Indirizzo laboratorio";
    const labPhone = process.env.LAB_PHONE ?? "+39 000 000 0000";
    const configuredLogoUrl = process.env.LAB_LOGO_URL ?? "/assets/logo.jpg";
    const labLogoUrl = configuredLogoUrl.startsWith("http://") || configuredLogoUrl.startsWith("https://")
        ? configuredLogoUrl
        : `${req.protocol}://${req.get("host")}${configuredLogoUrl.startsWith("/") ? configuredLogoUrl : `/${configuredLogoUrl}`}`;

    const pdfBuffer = await createCustomerInterventionsPdfBuffer({
        customerId: customer.id,
        customerName,
        customerPhone,
        customerEmail: customer.email ?? "-",
        labName,
        labEmail,
        labAddress,
        labPhone,
        labLogoUrl,
        interventionCount: interventions.length,
        interventions: interventions.map((intervention) => ({
            id: intervention.id,
            createdAtLabel: new Intl.DateTimeFormat("it-IT", {
                dateStyle: "medium",
            }).format(intervention.createdAt),
            type: intervention.type as "consegna_materiale" | "intervento_sede" | "intervento_remoto",
            status: intervention.status as "programmato" | "in_lavorazione" | "completato",
            description: intervention.description,
            scheduleLabel: intervention.interventionDate
                ? `${new Intl.DateTimeFormat("it-IT", { dateStyle: "medium" }).format(new Date(`${intervention.interventionDate}T00:00:00`))} ${intervention.startTime?.slice(0, 5) ?? ""}-${intervention.endTime?.slice(0, 5) ?? ""}`
                : null,
        })),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=customer-${id}-interventions.pdf`);
    res.send(pdfBuffer);
});

customersRouter.post("/", validate({ body: customerCreateBodySchema }), async (req, res) => {
    const createdCustomer = await createCustomer(req.body);

    res.status(201).json(createdCustomer[0]);
});

customersRouter.put(
    "/:id",
    validate({ params: customerIdParamsSchema, body: customerUpdateBodySchema }),
    async (req, res) => {
        const { id } = req.params as unknown as { id: number };
        const updatedCustomer = await updateCustomerById(id, req.body);

        if (updatedCustomer.length === 0) {
            res.status(404).json({ message: "Customer not found" });
            return;
        }

        res.json(updatedCustomer[0]);
    }
);

customersRouter.delete("/:id", validate({ params: customerIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const deletedCustomer = await deleteCustomerById(id);

    if (deletedCustomer.length === 0) {
        res.status(404).json({ message: "Customer not found" });
        return;
    }

    res.json(deletedCustomer[0]);
});

export default customersRouter;
