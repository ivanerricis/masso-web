import { desc, eq, or, sql } from "drizzle-orm";
import { db } from "../index";
import { collaboratorTable } from "../schema";
import type { NewCollaborator, UpdateCollaborator } from "../types";

type ListCollaboratorsParams = {
    page?: number;
    pageSize?: number;
    search?: string;
};

export const listCollaborators = async ({ page, pageSize, search }: ListCollaboratorsParams) => {
    const trimmedSearch = search?.trim();
    const searchPattern = `%${trimmedSearch ?? ""}%`;
    const searchConditions = trimmedSearch
        ? [
              sql`${collaboratorTable.id}::text ILIKE ${searchPattern}`,
              sql`${collaboratorTable.firstName}::text ILIKE ${searchPattern}`,
              sql`${collaboratorTable.lastName}::text ILIKE ${searchPattern}`,
              sql`${collaboratorTable.phoneNumber}::text ILIKE ${searchPattern}`,
              sql`${collaboratorTable.created_at}::text ILIKE ${searchPattern}`,
              sql`${collaboratorTable.updated_at}::text ILIKE ${searchPattern}`,
          ]
        : [];
    const whereClause = searchConditions.length > 0 ? or(...searchConditions) : undefined;
    const baseQuery = db.select().from(collaboratorTable).where(whereClause).orderBy(desc(collaboratorTable.created_at));

    if (page == null || pageSize == null) {
        return baseQuery;
    }

    const [items, totalCountRows] = await Promise.all([
        baseQuery.limit(pageSize).offset((page - 1) * pageSize),
        db.select({ total: sql<number>`count(*)` }).from(collaboratorTable).where(whereClause),
    ]);

    return {
        items,
        totalItems: Number(totalCountRows[0]?.total ?? 0),
    };
};

export const getCollaboratorById = (id: number) =>
    db.select().from(collaboratorTable).where(eq(collaboratorTable.id, id));

export const createCollaborator = (data: NewCollaborator) =>
    db.insert(collaboratorTable)
        .values({
            ...data,
            created_at: new Date(),
            updated_at: new Date(),
        })
        .returning();

export const updateCollaboratorById = (id: number, data: UpdateCollaborator) =>
    db.update(collaboratorTable)
        .set({
            ...data,
            updated_at: new Date(),
        })
        .where(eq(collaboratorTable.id, id))
        .returning();

export const deleteCollaboratorById = (id: number) =>
    db.delete(collaboratorTable).where(eq(collaboratorTable.id, id)).returning();
