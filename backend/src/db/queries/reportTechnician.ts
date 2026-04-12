import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { reportTechnicianTable } from "../schema";
import type { NewReportTechnician, UpdateReportTechnician } from "../types";

export const listReportTechnicians = () => db.select().from(reportTechnicianTable);

export const getReportTechnicianByIds = (reportId: number, technicianId: number) =>
    db.select().from(reportTechnicianTable).where(
        and(
            eq(reportTechnicianTable.reportId, reportId),
            eq(reportTechnicianTable.technicianId, technicianId)
        )
    );

export const createReportTechnician = (data: NewReportTechnician) =>
    db.insert(reportTechnicianTable).values(data).returning();

export const updateReportTechnicianByIds = (
    reportId: number,
    technicianId: number,
    data: UpdateReportTechnician
) =>
    db.update(reportTechnicianTable)
        .set(data)
        .where(
            and(
                eq(reportTechnicianTable.reportId, reportId),
                eq(reportTechnicianTable.technicianId, technicianId)
            )
        )
        .returning();

export const deleteReportTechnicianByIds = (reportId: number, technicianId: number) =>
    db.delete(reportTechnicianTable)
        .where(
            and(
                eq(reportTechnicianTable.reportId, reportId),
                eq(reportTechnicianTable.technicianId, technicianId)
            )
        )
        .returning();
