import type { DeviceDto } from "@/types/dtos";
import { api, mapEntityTimestamps } from "./client";
import type { EntityWithRawTimestamps } from "./client";

export type DeviceCreateInput = {
    name: string;
};

export type DeviceUpdateInput = Partial<DeviceCreateInput>;

export const listDevices = async () => {
    const response = await api.get<EntityWithRawTimestamps<DeviceDto>[]>("/devices");
    return response.data.map((device) => mapEntityTimestamps(device));
};

export const createDevice = async (payload: DeviceCreateInput) =>
    mapEntityTimestamps((await api.post<EntityWithRawTimestamps<DeviceDto>>("/devices", payload)).data);

export const updateDevice = async (id: number, payload: DeviceUpdateInput) =>
    mapEntityTimestamps((await api.put<EntityWithRawTimestamps<DeviceDto>>(`/devices/${id}`, payload)).data);

export const deleteDevice = async (id: number) =>
    mapEntityTimestamps((await api.delete<EntityWithRawTimestamps<DeviceDto>>(`/devices/${id}`)).data);
