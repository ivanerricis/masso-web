import type { DeviceDto } from "@/types/dtos";
import { api, mapEntityTimestamps } from "./client";
import type { EntityWithRawTimestamps } from "./client";
import type { PaginatedResponse } from "./client";

export type DeviceCreateInput = {
    name: string;
};

export type DeviceUpdateInput = Partial<DeviceCreateInput>;

export type ListDevicesParams = {
    page?: number;
    pageSize?: number;
    search?: string;
};

export function listDevices(): Promise<DeviceDto[]>;
export function listDevices(params: ListDevicesParams): Promise<PaginatedResponse<DeviceDto>>;
export async function listDevices(params?: ListDevicesParams) {
    const resolvedPage = params?.page ?? 1;
    const resolvedPageSize = params?.pageSize ?? 1000;
    const response = await api.get<PaginatedResponse<EntityWithRawTimestamps<DeviceDto>>>("/devices", {
        params: { page: resolvedPage, pageSize: resolvedPageSize, search: params?.search?.trim() || undefined },
    });

    const items = response.data.items.map((device) => mapEntityTimestamps(device));

    if (!params) {
        return items;
    }

    return {
        ...response.data,
        items,
    };
}

export const createDevice = async (payload: DeviceCreateInput) =>
    mapEntityTimestamps((await api.post<EntityWithRawTimestamps<DeviceDto>>("/devices", payload)).data);

export const updateDevice = async (id: number, payload: DeviceUpdateInput) =>
    mapEntityTimestamps((await api.put<EntityWithRawTimestamps<DeviceDto>>(`/devices/${id}`, payload)).data);

export const deleteDevice = async (id: number) =>
    mapEntityTimestamps((await api.delete<EntityWithRawTimestamps<DeviceDto>>(`/devices/${id}`)).data);
