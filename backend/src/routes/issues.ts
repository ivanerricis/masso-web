import { Router } from "express";
import { z } from "zod";
import {
    createIssue,
    deleteIssueById,
    getIssueById,
    listIssues,
    updateIssueById,
} from "../db/queries/issue";
import { validate } from "./validation";

const issuesRouter = Router();

const issueIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const issueCreateBodySchema = z
    .object({
        description: z.string().trim().min(1).max(255),
    })
    .strict();

const issueUpdateBodySchema = issueCreateBodySchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required",
    });

issuesRouter.get("/", async (_, res) => {
    const issues = await listIssues();

    res.json(issues);
});

issuesRouter.get("/:id", validate({ params: issueIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const issues = await getIssueById(id);

    if (issues.length === 0) {
        res.status(404).json({ message: "Issue not found" });
        return;
    }

    res.json(issues[0]);
});

issuesRouter.post("/", validate({ body: issueCreateBodySchema }), async (req, res) => {
    const createdIssue = await createIssue(req.body);

    res.status(201).json(createdIssue[0]);
});

issuesRouter.put(
    "/:id",
    validate({ params: issueIdParamsSchema, body: issueUpdateBodySchema }),
    async (req, res) => {
        const { id } = req.params as unknown as { id: number };
        const updatedIssue = await updateIssueById(id, req.body);

        if (updatedIssue.length === 0) {
            res.status(404).json({ message: "Issue not found" });
            return;
        }

        res.json(updatedIssue[0]);
    }
);

issuesRouter.delete("/:id", validate({ params: issueIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const deletedIssue = await deleteIssueById(id);

    if (deletedIssue.length === 0) {
        res.status(404).json({ message: "Issue not found" });
        return;
    }

    res.json(deletedIssue[0]);
});

export default issuesRouter;
