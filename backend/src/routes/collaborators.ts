import { Router } from "express";
import {
    createCollaborator,
    deleteCollaboratorById,
    getCollaboratorById,
    listCollaborators,
    updateCollaboratorById,
} from "../db/queries/collaborator";
import { parseId } from "./utils";

const collaboratorsRouter = Router();

collaboratorsRouter.get("/", async (_, res) => {
    const collaborators = await listCollaborators();

    res.json(collaborators);
});

collaboratorsRouter.get("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid collaborator id" });
        return;
    }

    const collaborators = await getCollaboratorById(id);

    if (collaborators.length === 0) {
        res.status(404).json({ message: "Collaborator not found" });
        return;
    }

    res.json(collaborators[0]);
});

collaboratorsRouter.post("/", async (req, res) => {
    const createdCollaborator = await createCollaborator(req.body);

    res.status(201).json(createdCollaborator[0]);
});

collaboratorsRouter.put("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid collaborator id" });
        return;
    }

    const updatedCollaborator = await updateCollaboratorById(id, req.body);

    if (updatedCollaborator.length === 0) {
        res.status(404).json({ message: "Collaborator not found" });
        return;
    }

    res.json(updatedCollaborator[0]);
});

collaboratorsRouter.delete("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid collaborator id" });
        return;
    }

    const deletedCollaborator = await deleteCollaboratorById(id);

    if (deletedCollaborator.length === 0) {
        res.status(404).json({ message: "Collaborator not found" });
        return;
    }

    res.json(deletedCollaborator[0]);
});

export default collaboratorsRouter;
