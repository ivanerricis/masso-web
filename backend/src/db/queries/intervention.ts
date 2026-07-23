import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "../index";
import { collaboratorTable, customerTable, interventionTable } from "../schema";
import type { NewIntervention, UpdateIntervention } from "../types";

type ListInterventionsParams = {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: "all" | "programmato" | "in_lavorazione" | "completato";
    type?: "all" | "consegna_materiale" | "intervento_sede" | "intervento_remoto";
    date?: string;
    customerId?: number;
};

export const listInterventions = async ({
    page,
    pageSize,
    search,
    status = "all",
    type = "all",
    date,
    customerId,
}: ListInterventionsParams) => {
    const trimmedSearch = search?.trim();
    const searchPattern = `%${trimmedSearch ?? ""}%`;
    const searchConditions = trimmedSearch
        ? [
              sql`${interventionTable.id}::text ILIKE ${searchPattern}`,
              sql`${interventionTable.description}::text ILIKE ${searchPattern}`,
              sql`${interventionTable.type}::text ILIKE ${searchPattern}`,
              sql`${interventionTable.status}::text ILIKE ${searchPattern}`,
              sql`${interventionTable.created_at}::text ILIKE ${searchPattern}`,
              sql`${customerTable.id}::text ILIKE ${searchPattern}`,
              sql`${customerTable.firstName}::text ILIKE ${searchPattern}`,
              sql`${customerTable.lastName}::text ILIKE ${searchPattern}`,
              sql`${customerTable.phoneNumber}::text ILIKE ${searchPattern}`,
              sql`${customerTable.phoneNumberSecondary}::text ILIKE ${searchPattern}`,
              sql`${collaboratorTable.id}::text ILIKE ${searchPattern}`,
              sql`${collaboratorTable.firstName}::text ILIKE ${searchPattern}`,
              sql`${collaboratorTable.lastName}::text ILIKE ${searchPattern}`,
          ]
        : [];
    const statusCondition = status !== "all" ? eq(interventionTable.status, status) : undefined;
    const typeCondition = type !== "all" ? eq(interventionTable.type, type) : undefined;
    const dateCondition = date ? sql`${interventionTable.created_at}::date = ${date}` : undefined;
    const customerCondition = customerId ? eq(interventionTable.customerId, customerId) : undefined;
    const searchCondition = searchConditions.length > 0 ? or(...searchConditions) : undefined;
    const whereConditions = [statusCondition, typeCondition, dateCondition, customerCondition, searchCondition].filter(
        (condition): condition is NonNullable<typeof condition> => condition != null
    );
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const baseQuery = db
        .select({
            id: interventionTable.id,
            type: interventionTable.type,
            description: interventionTable.description,
            status: interventionTable.status,
            interventionDate: interventionTable.interventionDate,
            startTime: interventionTable.startTime,
            endTime: interventionTable.endTime,
            customerId: interventionTable.customerId,
            collaboratorId: interventionTable.collaboratorId,
            customer: sql<string>`coalesce(nullif(concat_ws(' ', ${customerTable.firstName}, ${customerTable.lastName}), ''), '-')`,
            customerPhone: sql<string | null>`coalesce(${customerTable.phoneNumber}, ${customerTable.phoneNumberSecondary})`,
            collaborator: sql<string>`coalesce(nullif(concat_ws(' ', ${collaboratorTable.firstName}, ${collaboratorTable.lastName}), ''), '-')`,
            createdAt: interventionTable.created_at,
            updatedAt: interventionTable.updated_at,
        })
        .from(interventionTable)
        .innerJoin(customerTable, eq(customerTable.id, interventionTable.customerId))
        .innerJoin(collaboratorTable, eq(collaboratorTable.id, interventionTable.collaboratorId));

    if (page == null || pageSize == null) {
        return baseQuery.where(whereClause).orderBy(desc(interventionTable.created_at));
    }

    const [items, totalCountRows] = await Promise.all([
        baseQuery.where(whereClause).orderBy(desc(interventionTable.created_at)).limit(pageSize).offset((page - 1) * pageSize),
        db.select({ total: sql<number>`count(*)` })
            .from(interventionTable)
            .innerJoin(customerTable, eq(customerTable.id, interventionTable.customerId))
            .innerJoin(collaboratorTable, eq(collaboratorTable.id, interventionTable.collaboratorId))
            .where(whereClause),
    ]);

    return {
        items,
        totalItems: Number(totalCountRows[0]?.total ?? 0),
    };
};

export const getInterventionById = (id: number) =>
    db.select().from(interventionTable).where(eq(interventionTable.id, id));

export const createIntervention = (data: NewIntervention) =>
    db.insert(interventionTable).values(data).returning();

export const updateInterventionById = (id: number, data: UpdateIntervention) =>
    db.update(interventionTable)
        .set({
            ...data,
            updated_at: new Date(),
        })
        .where(eq(interventionTable.id, id))
        .returning();

export const deleteInterventionById = (id: number) =>
    db.delete(interventionTable).where(eq(interventionTable.id, id)).returning();
