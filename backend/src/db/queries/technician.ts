import { desc, eq, or, sql } from "drizzle-orm";
import { db } from "../index";
import { technicianTable } from "../schema";
import type { NewTechnician, UpdateTechnician } from "../types";

type ListTechniciansParams = {
    page?: number;
    pageSize?: number;
    search?: string;
};

export const listTechnicians = async ({ page, pageSize, search }: ListTechniciansParams) => {
    const trimmedSearch = search?.trim();
    const searchPattern = `%${trimmedSearch ?? ""}%`;
    const searchConditions = trimmedSearch
        ? [
              sql`${technicianTable.id}::text ILIKE ${searchPattern}`,
              sql`${technicianTable.firstName}::text ILIKE ${searchPattern}`,
              sql`${technicianTable.lastName}::text ILIKE ${searchPattern}`,
              sql`${technicianTable.phoneNumber}::text ILIKE ${searchPattern}`,
              sql`${technicianTable.vatNumber}::text ILIKE ${searchPattern}`,
              sql`${technicianTable.created_at}::text ILIKE ${searchPattern}`,
              sql`${technicianTable.updated_at}::text ILIKE ${searchPattern}`,
          ]
        : [];
    const whereClause = searchConditions.length > 0 ? or(...searchConditions) : undefined;
    const baseQuery = db.select().from(technicianTable).where(whereClause).orderBy(desc(technicianTable.created_at));

    if (page == null || pageSize == null) {
        return baseQuery;
    }

    const [items, totalCountRows] = await Promise.all([
        baseQuery.limit(pageSize).offset((page - 1) * pageSize),
        db.select({ total: sql<number>`count(*)` }).from(technicianTable).where(whereClause),
    ]);

    return {
        items,
        totalItems: Number(totalCountRows[0]?.total ?? 0),
    };
};

export const getTechnicianById = (id: number) =>
    db.select().from(technicianTable).where(eq(technicianTable.id, id));

export const createTechnician = (data: NewTechnician) =>
    db.insert(technicianTable).values(data).returning();

export const updateTechnicianById = (id: number, data: UpdateTechnician) =>
    db.update(technicianTable)
        .set(data)
        .where(eq(technicianTable.id, id))
        .returning();

export const deleteTechnicianById = (id: number) =>
    db.delete(technicianTable).where(eq(technicianTable.id, id)).returning();
