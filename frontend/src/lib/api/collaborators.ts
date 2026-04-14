import type { CollaboratorDto } from "@/types/dtos";
import { api, mapEntityTimestamps } from "./client";
import type { EntityWithRawTimestamps } from "./client";

export type CollaboratorCreateInput = {
    firstName: string;
    lastName?: string | null;
    phoneNumber?: string | null;
};

export const listCollaborators = async () => {
    const response = await api.get<EntityWithRawTimestamps<CollaboratorDto>[]>("/collaborators");
    return response.data.map((collaborator) => mapEntityTimestamps(collaborator));
};

export const createCollaborator = async (payload: CollaboratorCreateInput) =>
    mapEntityTimestamps((await api.post<EntityWithRawTimestamps<CollaboratorDto>>("/collaborators", payload)).data);

export const deleteCollaborator = async (id: number) =>
    mapEntityTimestamps((await api.delete<EntityWithRawTimestamps<CollaboratorDto>>(`/collaborators/${id}`)).data);
