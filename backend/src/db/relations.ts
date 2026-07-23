import { relations } from "drizzle-orm";
import {
    collaboratorTable,
    customerTable,
    deviceTable,
    interventionTable,
    IssueTable,
    reportTable,
    reportTechnicianTable,
    technicianTable,
} from "./schema";

export const reportRelations = relations(reportTable, ({ one, many }) => ({
    device: one(deviceTable, {
        fields: [reportTable.deviceId],
        references: [deviceTable.id],
    }),
    issue: one(IssueTable, {
        fields: [reportTable.issueId],
        references: [IssueTable.id],
    }),
    collaborator: one(collaboratorTable, {
        fields: [reportTable.collaboratorId],
        references: [collaboratorTable.id],
    }),
    customer: one(customerTable, {
        fields: [reportTable.customerId],
        references: [customerTable.id],
    }),
    reportTechnicians: many(reportTechnicianTable),
}));

export const deviceRelations = relations(deviceTable, ({ many }) => ({
    reports: many(reportTable),
}));

export const issueRelations = relations(IssueTable, ({ many }) => ({
    reports: many(reportTable),
}));

export const collaboratorRelations = relations(collaboratorTable, ({ many }) => ({
    reports: many(reportTable),
}));

export const customerRelations = relations(customerTable, ({ many }) => ({
    reports: many(reportTable),
    interventions: many(interventionTable),
}));

export const technicianRelations = relations(technicianTable, ({ many }) => ({
    reportTechnicians: many(reportTechnicianTable),
    interventions: many(interventionTable),
}));

export const reportTechnicianRelations = relations(reportTechnicianTable, ({ one }) => ({
    report: one(reportTable, {
        fields: [reportTechnicianTable.reportId],
        references: [reportTable.id],
    }),
    technician: one(technicianTable, {
        fields: [reportTechnicianTable.technicianId],
        references: [technicianTable.id],
    }),
}));

export const interventionRelations = relations(interventionTable, ({ one }) => ({
    customer: one(customerTable, {
        fields: [interventionTable.customerId],
        references: [customerTable.id],
    }),
    technician: one(technicianTable, {
        fields: [interventionTable.technicianId],
        references: [technicianTable.id],
    }),
}));
