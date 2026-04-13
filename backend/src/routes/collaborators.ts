import { Router } from "express";
import { z } from "zod";
import {
    createCollaborator,
    deleteCollaboratorById,
    getCollaboratorById,
    listCollaborators,
    updateCollaboratorById,
} from "../db/queries/collaborator";
import { validate } from "./validation";

const collaboratorsRouter = Router();

const collaboratorIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const collaboratorCreateBodySchema = z
    .object({
        firstName: z.string().trim().min(1).max(255),
        lastName: z.string().trim().min(1).max(255).nullable().optional(),
        phoneNumber: z.string().trim().min(1).max(20).nullable().optional(),
    })
    .strict();

const collaboratorUpdateBodySchema = collaboratorCreateBodySchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required",
    });

collaboratorsRouter.get("/", async (_, res) => {
    const collaborators = await listCollaborators();

    res.json(collaborators);
});

collaboratorsRouter.get("/:id", validate({ params: collaboratorIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const collaborators = await getCollaboratorById(id);

    if (collaborators.length === 0) {
        res.status(404).json({ message: "Collaborator not found" });
        return;
    }

    res.json(collaborators[0]);
});

collaboratorsRouter.post("/", validate({ body: collaboratorCreateBodySchema }), async (req, res) => {
    const createdCollaborator = await createCollaborator(req.body);

    res.status(201).json(createdCollaborator[0]);
});

collaboratorsRouter.put(
    "/:id",
    validate({ params: collaboratorIdParamsSchema, body: collaboratorUpdateBodySchema }),
    async (req, res) => {
        const { id } = req.params as unknown as { id: number };
        const updatedCollaborator = await updateCollaboratorById(id, req.body);

        if (updatedCollaborator.length === 0) {
            res.status(404).json({ message: "Collaborator not found" });
            return;
        }

        res.json(updatedCollaborator[0]);
    }
);

collaboratorsRouter.delete("/:id", validate({ params: collaboratorIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const deletedCollaborator = await deleteCollaboratorById(id);

    if (deletedCollaborator.length === 0) {
        res.status(404).json({ message: "Collaborator not found" });
        return;
    }

    res.json(deletedCollaborator[0]);
});

export default collaboratorsRouter;
