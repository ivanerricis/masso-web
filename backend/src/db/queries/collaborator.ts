import { desc, eq } from "drizzle-orm";
import { db } from "../index";
import { collaboratorTable } from "../schema";
import type { NewCollaborator, UpdateCollaborator } from "../types";

export const listCollaborators = () => db.select().from(collaboratorTable).orderBy(desc(collaboratorTable.created_at));

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
