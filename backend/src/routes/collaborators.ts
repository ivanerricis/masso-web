import { z } from "zod";
import {
    createCollaborator,
    deleteCollaboratorById,
    getCollaboratorById,
    listCollaborators,
    updateCollaboratorById,
} from "../db/queries/collaborator";
import { createCrudRouter } from "./crudRouter";

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

const collaboratorsRouter = createCrudRouter({
    notFoundMessage: "Collaborator not found",
    createBodySchema: collaboratorCreateBodySchema,
    updateBodySchema: collaboratorUpdateBodySchema,
    queries: {
        list: listCollaborators,
        getById: getCollaboratorById,
        create: createCollaborator,
        update: updateCollaboratorById,
        remove: deleteCollaboratorById,
    },
});

export default collaboratorsRouter;
