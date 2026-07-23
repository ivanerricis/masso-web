import { integer, pgTable, varchar, boolean, timestamp, date, time, text, primaryKey, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
    updated_at: timestamp(),
    created_at: timestamp().defaultNow().notNull(),
}

const userFields = {
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }),
    phoneNumber: varchar("phone_number", { length: 20 }),
}

export const reportTable = pgTable("report", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    note: varchar("note", { length: 255 }),
    password: varchar("password", { length: 255 }),
    issueDescription: varchar("issue_description", { length: 255 }),
    serviceDescription: varchar("service_description", { length: 255 }),
    dataBackup: boolean("data_backup").notNull().default(false),
    charger: boolean("charger").notNull().default(false),
    alerted: boolean("alerted").notNull().default(false),
    closed: boolean("closed").notNull().default(false),
    paymentMethod: varchar("payment_method", { length: 20 }).notNull().default("non_paid"),
    price: integer("price").notNull().default(0),
    ...timestamps,
    deviceId: integer("device_id").notNull().references(() => deviceTable.id),
    issueId: integer("issue_id").notNull().references(() => IssueTable.id),
    collaboratorId: integer("collaborator_id").references(() => collaboratorTable.id),
    customerId: integer("customer_id").notNull().references(() => customerTable.id),
}, (table) => [
    index("report_device_id_idx").on(table.deviceId),
    index("report_issue_id_idx").on(table.issueId),
    index("report_collaborator_id_idx").on(table.collaboratorId),
    index("report_customer_id_idx").on(table.customerId),
    index("report_note_trgm_idx").using("gin", sql`${table.note} gin_trgm_ops`),
    index("report_password_trgm_idx").using("gin", sql`${table.password} gin_trgm_ops`),
    index("report_issue_description_trgm_idx").using("gin", sql`${table.issueDescription} gin_trgm_ops`),
    index("report_service_description_trgm_idx").using("gin", sql`${table.serviceDescription} gin_trgm_ops`),
]);

export const customerTable = pgTable("customer", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    ...userFields,
    phoneNumberSecondary: varchar("phone_number_secondary", { length: 20 }),
    email: varchar("email", { length: 255 }),
    ...timestamps
}, (table) => [
    index("customer_first_name_trgm_idx").using("gin", sql`${table.firstName} gin_trgm_ops`),
    index("customer_last_name_trgm_idx").using("gin", sql`${table.lastName} gin_trgm_ops`),
    index("customer_phone_number_trgm_idx").using("gin", sql`${table.phoneNumber} gin_trgm_ops`),
    index("customer_phone_number_secondary_trgm_idx").using("gin", sql`${table.phoneNumberSecondary} gin_trgm_ops`),
    index("customer_email_trgm_idx").using("gin", sql`${table.email} gin_trgm_ops`),
])

export const collaboratorTable = pgTable("collaborator", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    ...userFields,
    ...timestamps
}, (table) => [
    index("collaborator_first_name_trgm_idx").using("gin", sql`${table.firstName} gin_trgm_ops`),
    index("collaborator_last_name_trgm_idx").using("gin", sql`${table.lastName} gin_trgm_ops`),
    index("collaborator_phone_number_trgm_idx").using("gin", sql`${table.phoneNumber} gin_trgm_ops`),
])

export const technicianTable = pgTable("technician", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    ...userFields,
    vatNumber: varchar("vat_number", { length: 20 }).unique(),
    ...timestamps
}, (table) => [
    index("technician_first_name_trgm_idx").using("gin", sql`${table.firstName} gin_trgm_ops`),
    index("technician_last_name_trgm_idx").using("gin", sql`${table.lastName} gin_trgm_ops`),
    index("technician_phone_number_trgm_idx").using("gin", sql`${table.phoneNumber} gin_trgm_ops`),
    index("technician_vat_number_trgm_idx").using("gin", sql`${table.vatNumber} gin_trgm_ops`),
])

export const deviceTable = pgTable("device", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    ...timestamps
}, (table) => [
    index("device_name_trgm_idx").using("gin", sql`${table.name} gin_trgm_ops`),
])

export const IssueTable = pgTable("issue", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    description: varchar("description", { length: 255 }).notNull().unique(),
    ...timestamps
}, (table) => [
    index("issue_description_trgm_idx").using("gin", sql`${table.description} gin_trgm_ops`),
])

export const reportTechnicianTable = pgTable("report_technician",
    {
        reportId: integer("report_id").notNull().references(() => reportTable.id),
        technicianId: integer("technician_id").notNull().references(() => technicianTable.id),
        price: integer("price").notNull().default(0),
    }, (table) => ([
        primaryKey({ columns: [table.reportId] }),
    ])
)

export const interventionTypes = ["consegna_materiale", "intervento_sede", "intervento_remoto"] as const;
export const interventionStatuses = ["programmato", "in_lavorazione", "completato"] as const;

export const interventionTable = pgTable("intervention", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    type: varchar("type", { length: 30 }).notNull(),
    description: text("description").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("programmato"),
    interventionDate: date("intervention_date"),
    startTime: time("start_time"),
    endTime: time("end_time"),
    ...timestamps,
    customerId: integer("customer_id").notNull().references(() => customerTable.id),
    technicianId: integer("technician_id").notNull().references(() => technicianTable.id),
}, (table) => [
    index("intervention_customer_id_idx").on(table.customerId),
    index("intervention_technician_id_idx").on(table.technicianId),
    index("intervention_type_idx").on(table.type),
    index("intervention_status_idx").on(table.status),
    index("intervention_description_trgm_idx").using("gin", sql`${table.description} gin_trgm_ops`),
]);