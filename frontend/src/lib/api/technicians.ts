import type { TechnicianDto } from "@/types/dtos";
import { api, mapEntityTimestamps } from "./client";
import type { EntityWithRawTimestamps } from "./client";

export type TechnicianCreateInput = {
    firstName: string;
    lastName?: string | null;
    phoneNumber?: string | null;
    vatNumber?: string | null;
};

export const listTechnicians = async () => {
    const response = await api.get<EntityWithRawTimestamps<TechnicianDto>[]>("/technicians");
    return response.data.map((technician) => mapEntityTimestamps(technician));
};

export const createTechnician = async (payload: TechnicianCreateInput) =>
    mapEntityTimestamps((await api.post<EntityWithRawTimestamps<TechnicianDto>>("/technicians", payload)).data);

export const deleteTechnician = async (id: number) =>
    mapEntityTimestamps((await api.delete<EntityWithRawTimestamps<TechnicianDto>>(`/technicians/${id}`)).data);
