import { desc, eq } from "drizzle-orm";
import { db } from "../index";
import { technicianTable } from "../schema";
import type { NewTechnician, UpdateTechnician } from "../types";

export const listTechnicians = () => db.select().from(technicianTable).orderBy(desc(technicianTable.created_at));

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
