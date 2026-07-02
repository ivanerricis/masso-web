import { Router } from "express";
import { z } from "zod";
import {
    createCustomer,
    deleteCustomerById,
    getCustomerById,
    listCustomers,
    updateCustomerById,
} from "../db/queries/customer";
import { validate } from "./validation";

const customersRouter = Router();

const customerIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const customerListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(1000).default(10),
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
        page: number;
        pageSize: number;
        search?: string;
    };

    const { items, totalItems } = await listCustomers({ page, pageSize, search });

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
