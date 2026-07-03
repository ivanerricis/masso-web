import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "../index";
import { collaboratorTable, customerTable, deviceTable, IssueTable, reportTable, reportTechnicianTable } from "../schema";
import type { NewReport, UpdateReport } from "../types";

type ListReportsParams = {
    page?: number;
    pageSize?: number;
    search?: string;
    visibility?: "all" | "open" | "closed";
    date?: string;
};

export const listReports = async ({ page, pageSize, search, visibility = "all", date }: ListReportsParams) => {
    const technicianPriceSubquery = db
        .select({
            reportId: reportTechnicianTable.reportId,
            technicianPrice: sql<number>`coalesce(sum(${reportTechnicianTable.price}), 0)::int`.as("technicianPrice"),
        })
        .from(reportTechnicianTable)
        .groupBy(reportTechnicianTable.reportId)
        .as("technician_prices");

    const trimmedSearch = search?.trim();
    const searchPattern = `%${trimmedSearch ?? ""}%`;
    const searchConditions = trimmedSearch
        ? [
              sql`${reportTable.id}::text ILIKE ${searchPattern}`,
              sql`${reportTable.note}::text ILIKE ${searchPattern}`,
              sql`${reportTable.password}::text ILIKE ${searchPattern}`,
              sql`${reportTable.issueDescription}::text ILIKE ${searchPattern}`,
              sql`${reportTable.serviceDescription}::text ILIKE ${searchPattern}`,
              sql`${reportTable.dataBackup}::text ILIKE ${searchPattern}`,
              sql`${reportTable.charger}::text ILIKE ${searchPattern}`,
              sql`${reportTable.closed}::text ILIKE ${searchPattern}`,
              sql`${reportTable.paymentMethod}::text ILIKE ${searchPattern}`,
              sql`${reportTable.price}::text ILIKE ${searchPattern}`,
              sql`${reportTable.created_at}::text ILIKE ${searchPattern}`,
              sql`${reportTable.updated_at}::text ILIKE ${searchPattern}`,
              sql`${customerTable.id}::text ILIKE ${searchPattern}`,
              sql`${customerTable.firstName}::text ILIKE ${searchPattern}`,
              sql`${customerTable.lastName}::text ILIKE ${searchPattern}`,
              sql`${customerTable.phoneNumber}::text ILIKE ${searchPattern}`,
              sql`${customerTable.phoneNumberSecondary}::text ILIKE ${searchPattern}`,
              sql`${customerTable.email}::text ILIKE ${searchPattern}`,
              sql`${deviceTable.id}::text ILIKE ${searchPattern}`,
              sql`${deviceTable.name}::text ILIKE ${searchPattern}`,
              sql`${IssueTable.id}::text ILIKE ${searchPattern}`,
              sql`${IssueTable.description}::text ILIKE ${searchPattern}`,
              sql`${collaboratorTable.id}::text ILIKE ${searchPattern}`,
              sql`${collaboratorTable.firstName}::text ILIKE ${searchPattern}`,
              sql`${collaboratorTable.lastName}::text ILIKE ${searchPattern}`,
              sql`${collaboratorTable.phoneNumber}::text ILIKE ${searchPattern}`,
              sql`${technicianPriceSubquery.technicianPrice}::text ILIKE ${searchPattern}`,
          ]
        : [];
    const visibilityCondition =
        visibility === "open" ? eq(reportTable.closed, false) : visibility === "closed" ? eq(reportTable.closed, true) : undefined;
    const dateCondition = date ? sql`${reportTable.created_at}::date = ${date}` : undefined;
    const searchCondition = searchConditions.length > 0 ? or(...searchConditions) : undefined;
    const whereConditions = [visibilityCondition, dateCondition, searchCondition].filter(
        (condition): condition is NonNullable<typeof condition> => condition != null
    );
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const baseQuery = db
        .select({
            id: reportTable.id,
            customerId: reportTable.customerId,
            deviceId: reportTable.deviceId,
            issueId: reportTable.issueId,
            collaboratorId: reportTable.collaboratorId,
            note: reportTable.note,
            password: reportTable.password,
            issueDescription: reportTable.issueDescription,
            serviceDescription: reportTable.serviceDescription,
            dataBackup: reportTable.dataBackup,
            charger: reportTable.charger,
            paymentMethod: reportTable.paymentMethod,
            price: reportTable.price,
            customer: sql<string>`coalesce(nullif(concat_ws(' ', ${customerTable.firstName}, ${customerTable.lastName}), ''), '-')`,
            customerPhone: sql<string | null>`coalesce(${customerTable.phoneNumber}, ${customerTable.phoneNumberSecondary})`,
            device: deviceTable.name,
            issue: IssueTable.description,
            technician: sql<string>`coalesce(nullif(concat_ws(' ', ${collaboratorTable.firstName}, ${collaboratorTable.lastName}), ''), '-')`,
            internalPrice: reportTable.price,
            technicianPrice: sql<number>`coalesce(${technicianPriceSubquery.technicianPrice}, 0)::int`,
            totalPrice: sql<number>`(${reportTable.price} + coalesce(${technicianPriceSubquery.technicianPrice}, 0))::int`,
            closed: reportTable.closed,
            createdAt: reportTable.created_at,
            updatedAt: reportTable.updated_at,
        })
        .from(reportTable)
        .innerJoin(customerTable, eq(customerTable.id, reportTable.customerId))
        .innerJoin(deviceTable, eq(deviceTable.id, reportTable.deviceId))
        .innerJoin(IssueTable, eq(IssueTable.id, reportTable.issueId))
        .leftJoin(collaboratorTable, eq(collaboratorTable.id, reportTable.collaboratorId))
        .leftJoin(technicianPriceSubquery, eq(technicianPriceSubquery.reportId, reportTable.id));

    if (page == null || pageSize == null) {
        return baseQuery.where(whereClause).orderBy(desc(reportTable.created_at));
    }

    const [items, totalCountRows] = await Promise.all([
        baseQuery.where(whereClause).orderBy(desc(reportTable.created_at)).limit(pageSize).offset((page - 1) * pageSize),
        db.select({ total: sql<number>`count(*)` })
            .from(reportTable)
            .innerJoin(customerTable, eq(customerTable.id, reportTable.customerId))
            .innerJoin(deviceTable, eq(deviceTable.id, reportTable.deviceId))
            .innerJoin(IssueTable, eq(IssueTable.id, reportTable.issueId))
            .leftJoin(collaboratorTable, eq(collaboratorTable.id, reportTable.collaboratorId))
            .leftJoin(technicianPriceSubquery, eq(technicianPriceSubquery.reportId, reportTable.id))
            .where(whereClause),
    ]);

    return {
        items,
        totalItems: Number(totalCountRows[0]?.total ?? 0),
    };
};

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
