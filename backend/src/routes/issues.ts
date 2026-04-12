import { Router } from "express";
import {
    createIssue,
    deleteIssueById,
    getIssueById,
    listIssues,
    updateIssueById,
} from "../db/queries/issue";
import { parseId } from "./utils";

const issuesRouter = Router();

issuesRouter.get("/", async (_, res) => {
    const issues = await listIssues();

    res.json(issues);
});

issuesRouter.get("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid issue id" });
        return;
    }

    const issues = await getIssueById(id);

    if (issues.length === 0) {
        res.status(404).json({ message: "Issue not found" });
        return;
    }

    res.json(issues[0]);
});

issuesRouter.post("/", async (req, res) => {
    const createdIssue = await createIssue(req.body);

    res.status(201).json(createdIssue[0]);
});

issuesRouter.put("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid issue id" });
        return;
    }

    const updatedIssue = await updateIssueById(id, req.body);

    if (updatedIssue.length === 0) {
        res.status(404).json({ message: "Issue not found" });
        return;
    }

    res.json(updatedIssue[0]);
});

issuesRouter.delete("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid issue id" });
        return;
    }

    const deletedIssue = await deleteIssueById(id);

    if (deletedIssue.length === 0) {
        res.status(404).json({ message: "Issue not found" });
        return;
    }

    res.json(deletedIssue[0]);
});

export default issuesRouter;
