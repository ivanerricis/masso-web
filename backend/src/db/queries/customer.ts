import { asc, desc, eq, or, sql } from "drizzle-orm";
import { db } from "../index";
import { customerTable } from "../schema";
import type { NewCustomer, UpdateCustomer } from "../types";
import { takeUnpaginated } from "./pagination";

type ListCustomersParams = {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
};

export const listCustomers = async ({
    page,
    pageSize,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
}: ListCustomersParams) => {
    const trimmedSearch = search?.trim();
    const searchPattern = `%${trimmedSearch ?? ""}%`;
    const searchConditions = trimmedSearch
        ? [
              sql`${customerTable.id}::text ILIKE ${searchPattern}`,
              sql`${customerTable.firstName}::text ILIKE ${searchPattern}`,
              sql`${customerTable.lastName}::text ILIKE ${searchPattern}`,
              sql`${customerTable.phoneNumber}::text ILIKE ${searchPattern}`,
              sql`${customerTable.phoneNumberSecondary}::text ILIKE ${searchPattern}`,
              sql`${customerTable.email}::text ILIKE ${searchPattern}`,
              sql`${customerTable.created_at}::text ILIKE ${searchPattern}`,
              sql`${customerTable.updated_at}::text ILIKE ${searchPattern}`,
          ]
        : [];
    const whereClause = searchConditions.length > 0 ? or(...searchConditions) : undefined;
    const orderByClause =
        sortBy === "name"
            ? sortOrder === "asc"
                ? [asc(customerTable.firstName), asc(customerTable.lastName)]
                : [desc(customerTable.firstName), desc(customerTable.lastName)]
            : [sortOrder === "asc" ? asc(customerTable.created_at) : desc(customerTable.created_at)];
    const baseQuery = db
        .select()
        .from(customerTable)
        .where(whereClause)
        .orderBy(...orderByClause);

    if (page == null || pageSize == null) {
        return takeUnpaginated(baseQuery, "customers");
    }

    const [items, totalCountRows] = await Promise.all([
        baseQuery.limit(pageSize).offset((page - 1) * pageSize),
        db
            .select({ total: sql<number>`count(*)` })
            .from(customerTable)
            .where(whereClause),
    ]);

    return {
        items,
        totalItems: Number(totalCountRows[0]?.total ?? 0),
    };
};

export const getCustomerById = (id: number) => db.select().from(customerTable).where(eq(customerTable.id, id));

export const createCustomer = (data: NewCustomer) => db.insert(customerTable).values(data).returning();

export const updateCustomerById = (id: number, data: UpdateCustomer) =>
    db.update(customerTable).set(data).where(eq(customerTable.id, id)).returning();

export const deleteCustomerById = (id: number) => db.delete(customerTable).where(eq(customerTable.id, id)).returning();
