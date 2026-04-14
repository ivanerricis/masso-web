import type { DeviceDto } from "@/types/dtos";
import { api, mapEntityTimestamps } from "./client";
import type { EntityWithRawTimestamps } from "./client";

export type DeviceCreateInput = {
    name: string;
};

export const listDevices = async () => {
    const response = await api.get<EntityWithRawTimestamps<DeviceDto>[]>("/devices");
    return response.data.map((device) => mapEntityTimestamps(device));
};

export const createDevice = async (payload: DeviceCreateInput) =>
    mapEntityTimestamps((await api.post<EntityWithRawTimestamps<DeviceDto>>("/devices", payload)).data);

export const deleteDevice = async (id: number) =>
    mapEntityTimestamps((await api.delete<EntityWithRawTimestamps<DeviceDto>>(`/devices/${id}`)).data);
