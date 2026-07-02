import type { CollaboratorDto } from "@/types/dtos";
import { api, mapEntityTimestamps } from "./client";
import type { EntityWithRawTimestamps } from "./client";
import type { PaginatedResponse } from "./client";

export type CollaboratorCreateInput = {
    firstName: string;
    lastName?: string | null;
    phoneNumber?: string | null;
};

export type CollaboratorUpdateInput = Partial<CollaboratorCreateInput>;

export type ListCollaboratorsParams = {
    page?: number;
    pageSize?: number;
    search?: string;
};

export function listCollaborators(): Promise<CollaboratorDto[]>;
export function listCollaborators(params: ListCollaboratorsParams): Promise<PaginatedResponse<CollaboratorDto>>;
export async function listCollaborators(params?: ListCollaboratorsParams) {
    const resolvedPage = params?.page ?? 1;
    const resolvedPageSize = params?.pageSize ?? 1000;
    const response = await api.get<PaginatedResponse<EntityWithRawTimestamps<CollaboratorDto>>>("/collaborators", {
        params: { page: resolvedPage, pageSize: resolvedPageSize, search: params?.search?.trim() || undefined },
    });

    const items = response.data.items.map((collaborator) => mapEntityTimestamps(collaborator));

    if (!params) {
        return items;
    }

    return {
        ...response.data,
        items,
    };
}

export const createCollaborator = async (payload: CollaboratorCreateInput) =>
    mapEntityTimestamps((await api.post<EntityWithRawTimestamps<CollaboratorDto>>("/collaborators", payload)).data);

export const updateCollaborator = async (id: number, payload: CollaboratorUpdateInput) =>
    mapEntityTimestamps((await api.put<EntityWithRawTimestamps<CollaboratorDto>>(`/collaborators/${id}`, payload)).data);

export const deleteCollaborator = async (id: number) =>
    mapEntityTimestamps((await api.delete<EntityWithRawTimestamps<CollaboratorDto>>(`/collaborators/${id}`)).data);
