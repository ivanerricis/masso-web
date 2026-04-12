import { eq } from "drizzle-orm";
import { db } from "../index";
import { IssueTable } from "../schema";
import type { NewIssue, UpdateIssue } from "../types";

export const listIssues = () => db.select().from(IssueTable);

export const getIssueById = (id: number) =>
    db.select().from(IssueTable).where(eq(IssueTable.id, id));

export const createIssue = (data: NewIssue) =>
    db.insert(IssueTable).values(data).returning();

export const updateIssueById = (id: number, data: UpdateIssue) =>
    db.update(IssueTable)
        .set(data)
        .where(eq(IssueTable.id, id))
        .returning();

export const deleteIssueById = (id: number) =>
    db.delete(IssueTable).where(eq(IssueTable.id, id)).returning();
