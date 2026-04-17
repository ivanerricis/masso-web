import { desc, eq } from "drizzle-orm";
import { db } from "../index";
import { reportTable } from "../schema";
import type { NewReport, UpdateReport } from "../types";

export const listReports = () => db.select().from(reportTable).orderBy(desc(reportTable.created_at));

export const getReportById = (id: number) =>
    db.select().from(reportTable).where(eq(reportTable.id, id));

export const createReport = (data: NewReport) =>
    db.insert(reportTable).values(data).returning();

export const updateReportById = (id: number, data: UpdateReport) =>
    db.update(reportTable)
        .set({
            ...data,
            updated_at: new Date(),
        })
        .where(eq(reportTable.id, id))
        .returning();

export const deleteReportById = (id: number) =>
    db.delete(reportTable).where(eq(reportTable.id, id)).returning();
