import { desc, eq, or, sql } from "drizzle-orm";
import { db } from "../index";
import { IssueTable } from "../schema";
import type { NewIssue, UpdateIssue } from "../types";

type ListIssuesParams = {
    page: number;
    pageSize: number;
    search?: string;
};

export const listIssues = async ({ page, pageSize, search }: ListIssuesParams) => {
    const trimmedSearch = search?.trim();
    const searchPattern = `%${trimmedSearch ?? ""}%`;
    const searchConditions = trimmedSearch
        ? [
              sql`${IssueTable.id}::text ILIKE ${searchPattern}`,
              sql`${IssueTable.description}::text ILIKE ${searchPattern}`,
              sql`${IssueTable.created_at}::text ILIKE ${searchPattern}`,
              sql`${IssueTable.updated_at}::text ILIKE ${searchPattern}`,
          ]
        : [];
    const whereClause = searchConditions.length > 0 ? or(...searchConditions) : undefined;
    const offset = (page - 1) * pageSize;

    const [items, totalCountRows] = await Promise.all([
        db.select().from(IssueTable).where(whereClause).orderBy(desc(IssueTable.created_at)).limit(pageSize).offset(offset),
        db.select({ total: sql<number>`count(*)` }).from(IssueTable).where(whereClause),
    ]);

    return {
        items,
        totalItems: Number(totalCountRows[0]?.total ?? 0),
    };
};

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
