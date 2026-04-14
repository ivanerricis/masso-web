import type { IssueDto } from "@/types/dtos";
import { api, mapEntityTimestamps } from "./client";
import type { EntityWithRawTimestamps } from "./client";

export type IssueCreateInput = {
    description: string;
};

export const listIssues = async () => {
    const response = await api.get<EntityWithRawTimestamps<IssueDto>[]>("/issues");
    return response.data.map((issue) => mapEntityTimestamps(issue));
};

export const createIssue = async (payload: IssueCreateInput) =>
    mapEntityTimestamps((await api.post<EntityWithRawTimestamps<IssueDto>>("/issues", payload)).data);

export const deleteIssue = async (id: number) =>
    mapEntityTimestamps((await api.delete<EntityWithRawTimestamps<IssueDto>>(`/issues/${id}`)).data);
