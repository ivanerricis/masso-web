import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
    collaboratorTable,
    customerTable,
    deviceTable,
    IssueTable,
    reportTable,
    reportTechnicianTable,
    technicianTable,
} from "./schema";

export type Report = InferSelectModel<typeof reportTable>;
export type NewReport = InferInsertModel<typeof reportTable>;
export type UpdateReport = Partial<Omit<NewReport, "id">>;

export type Customer = InferSelectModel<typeof customerTable>;
export type NewCustomer = InferInsertModel<typeof customerTable>;
export type UpdateCustomer = Partial<Omit<NewCustomer, "id">>;

export type Collaborator = InferSelectModel<typeof collaboratorTable>;
export type NewCollaborator = InferInsertModel<typeof collaboratorTable>;
export type UpdateCollaborator = Partial<Omit<NewCollaborator, "id">>;

export type Technician = InferSelectModel<typeof technicianTable>;
export type NewTechnician = InferInsertModel<typeof technicianTable>;
export type UpdateTechnician = Partial<Omit<NewTechnician, "id">>;

export type Device = InferSelectModel<typeof deviceTable>;
export type NewDevice = InferInsertModel<typeof deviceTable>;
export type UpdateDevice = Partial<Omit<NewDevice, "id">>;

export type Issue = InferSelectModel<typeof IssueTable>;
export type NewIssue = InferInsertModel<typeof IssueTable>;
export type UpdateIssue = Partial<Omit<NewIssue, "id">>;

export type ReportTechnician = InferSelectModel<typeof reportTechnicianTable>;
export type NewReportTechnician = InferInsertModel<typeof reportTechnicianTable>;
export type UpdateReportTechnician = Partial<Omit<NewReportTechnician, "reportId" | "technicianId">>;
