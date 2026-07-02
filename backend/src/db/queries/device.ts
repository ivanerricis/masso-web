import { desc, eq, or, sql } from "drizzle-orm";
import { db } from "../index";
import { deviceTable } from "../schema";
import type { NewDevice, UpdateDevice } from "../types";

type ListDevicesParams = {
    page: number;
    pageSize: number;
    search?: string;
};

export const listDevices = async ({ page, pageSize, search }: ListDevicesParams) => {
    const trimmedSearch = search?.trim();
    const searchPattern = `%${trimmedSearch ?? ""}%`;
    const searchConditions = trimmedSearch
        ? [
              sql`${deviceTable.id}::text ILIKE ${searchPattern}`,
              sql`${deviceTable.name}::text ILIKE ${searchPattern}`,
              sql`${deviceTable.created_at}::text ILIKE ${searchPattern}`,
              sql`${deviceTable.updated_at}::text ILIKE ${searchPattern}`,
          ]
        : [];
    const whereClause = searchConditions.length > 0 ? or(...searchConditions) : undefined;
    const offset = (page - 1) * pageSize;

    const [items, totalCountRows] = await Promise.all([
        db.select().from(deviceTable).where(whereClause).orderBy(desc(deviceTable.created_at)).limit(pageSize).offset(offset),
        db.select({ total: sql<number>`count(*)` }).from(deviceTable).where(whereClause),
    ]);

    return {
        items,
        totalItems: Number(totalCountRows[0]?.total ?? 0),
    };
};

export const getDeviceById = (id: number) =>
    db.select().from(deviceTable).where(eq(deviceTable.id, id));

export const createDevice = (data: NewDevice) =>
    db.insert(deviceTable).values(data).returning();

export const updateDeviceById = (id: number, data: UpdateDevice) =>
    db.update(deviceTable)
        .set(data)
        .where(eq(deviceTable.id, id))
        .returning();

export const deleteDeviceById = (id: number) =>
    db.delete(deviceTable).where(eq(deviceTable.id, id)).returning();
