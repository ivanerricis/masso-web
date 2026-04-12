import { eq } from "drizzle-orm";
import { db } from "../index";
import { customerTable } from "../schema";
import type { NewCustomer, UpdateCustomer } from "../types";

export const listCustomers = () => db.select().from(customerTable);

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
