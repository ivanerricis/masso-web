import { eq } from "drizzle-orm";
import { db } from "../index";
import { deviceTable } from "../schema";
import type { NewDevice, UpdateDevice } from "../types";

export const listDevices = () => db.select().from(deviceTable);

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
