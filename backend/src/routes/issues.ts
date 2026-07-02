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

const issueListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(1000).default(10),
    search: z.string().trim().max(255).optional(),
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

issuesRouter.get("/", validate({ query: issueListQuerySchema }), async (req, res) => {
    const { page, pageSize, search } = req.query as unknown as {
        page: number;
        pageSize: number;
        search?: string;
    };

    const { items, totalItems } = await listIssues({ page, pageSize, search });

    res.json({
        items,
        totalItems,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    });
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
