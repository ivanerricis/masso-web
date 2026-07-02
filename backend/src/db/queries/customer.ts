import { desc, eq, or, sql } from "drizzle-orm";
import { db } from "../index";
import { customerTable } from "../schema";
import type { NewCustomer, UpdateCustomer } from "../types";

type ListCustomersParams = {
    page: number;
    pageSize: number;
    search?: string;
};

export const listCustomers = async ({ page, pageSize, search }: ListCustomersParams) => {
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
    const offset = (page - 1) * pageSize;

    const [items, totalCountRows] = await Promise.all([
        db.select().from(customerTable).where(whereClause).orderBy(desc(customerTable.created_at)).limit(pageSize).offset(offset),
        db.select({ total: sql<number>`count(*)` }).from(customerTable).where(whereClause),
    ]);

    return {
        items,
        totalItems: Number(totalCountRows[0]?.total ?? 0),
    };
};

export const getCustomerById = (id: number) =>
    db.select().from(customerTable).where(eq(customerTable.id, id));

export const createCustomer = (data: NewCustomer) =>
    db.insert(customerTable).values(data).returning();

export const updateCustomerById = (id: number, data: UpdateCustomer) =>
    db.update(customerTable)
        .set(data)
        .where(eq(customerTable.id, id))
        .returning();

export const deleteCustomerById = (id: number) =>
    db.delete(customerTable).where(eq(customerTable.id, id)).returning();
