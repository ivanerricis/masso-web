import { integer, pgTable, varchar, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";

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
    closed: boolean("closed").notNull().default(false),
    toInvoice: boolean("to_invoice").notNull().default(false),
    price: integer("price").notNull().default(0),
    ...timestamps,
    deviceId: integer("device_id").notNull().references(() => deviceTable.id),
    issueId: integer("issue_id").notNull().references(() => IssueTable.id),
    collaboratorId: integer("collaborator_id").references(() => collaboratorTable.id),
    customerId: integer("customer_id").notNull().references(() => customerTable.id),
});

export const customerTable = pgTable("customer", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    ...userFields,
    email: varchar("email", { length: 255 }),
    vatNumber: varchar("vat_number", { length: 20 }).unique(),
    ...timestamps
})

export const collaboratorTable = pgTable("collaborator", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    ...userFields,
    ...timestamps
})

export const technicianTable = pgTable("technician", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    ...userFields,
    vatNumber: varchar("vat_number", { length: 20 }).unique(),
    ...timestamps
})

export const deviceTable = pgTable("device", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    ...timestamps
})

export const IssueTable = pgTable("issue", {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    description: varchar("description", { length: 255 }).notNull().unique(),
    ...timestamps
})

export const reportTechnicianTable = pgTable("report_technician",
    {
        reportId: integer("report_id").notNull().references(() => reportTable.id),
        technicianId: integer("technician_id").notNull().references(() => technicianTable.id),
        price: integer("price").notNull().default(0),
    }, (table) => ([
        primaryKey({ columns: [table.reportId] }),
    ])
)