import { Router } from "express";
import { z } from "zod";
import {
    createTechnician,
    deleteTechnicianById,
    getTechnicianById,
    listTechnicians,
    updateTechnicianById,
} from "../db/queries/technician";
import { validate } from "./validation";

const techniciansRouter = Router();

const technicianIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const technicianCreateBodySchema = z
    .object({
        firstName: z.string().trim().min(1).max(255),
        lastName: z.string().trim().min(1).max(255).nullable().optional(),
        phoneNumber: z.string().trim().min(1).max(20).nullable().optional(),
        vatNumber: z.string().trim().min(1).max(20).nullable().optional(),
    })
    .strict();

const technicianUpdateBodySchema = technicianCreateBodySchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required",
    });

techniciansRouter.get("/", async (_, res) => {
    const technicians = await listTechnicians();

    res.json(technicians);
});

techniciansRouter.get("/:id", validate({ params: technicianIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const technicians = await getTechnicianById(id);

    if (technicians.length === 0) {
        res.status(404).json({ message: "Technician not found" });
        return;
    }

    res.json(technicians[0]);
});

techniciansRouter.post("/", validate({ body: technicianCreateBodySchema }), async (req, res) => {
    const createdTechnician = await createTechnician(req.body);

    res.status(201).json(createdTechnician[0]);
});

techniciansRouter.put(
    "/:id",
    validate({ params: technicianIdParamsSchema, body: technicianUpdateBodySchema }),
    async (req, res) => {
        const { id } = req.params as unknown as { id: number };
        const updatedTechnician = await updateTechnicianById(id, req.body);

        if (updatedTechnician.length === 0) {
            res.status(404).json({ message: "Technician not found" });
            return;
        }

        res.json(updatedTechnician[0]);
    }
);

techniciansRouter.delete("/:id", validate({ params: technicianIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const deletedTechnician = await deleteTechnicianById(id);

    if (deletedTechnician.length === 0) {
        res.status(404).json({ message: "Technician not found" });
        return;
    }

    res.json(deletedTechnician[0]);
});

export default techniciansRouter;
