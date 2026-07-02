import type { IssueDto } from "@/types/dtos";
import { api, mapEntityTimestamps } from "./client";
import type { EntityWithRawTimestamps } from "./client";
import type { PaginatedResponse } from "./client";

export type IssueCreateInput = {
    description: string;
};

export type IssueUpdateInput = Partial<IssueCreateInput>;

export type ListIssuesParams = {
    page?: number;
    pageSize?: number;
    search?: string;
};

export function listIssues(): Promise<IssueDto[]>;
export function listIssues(params: ListIssuesParams): Promise<PaginatedResponse<IssueDto>>;
export async function listIssues(params?: ListIssuesParams) {
    const resolvedPage = params?.page ?? 1;
    const resolvedPageSize = params?.pageSize ?? 1000;
    const response = await api.get<PaginatedResponse<EntityWithRawTimestamps<IssueDto>>>("/issues", {
        params: { page: resolvedPage, pageSize: resolvedPageSize, search: params?.search?.trim() || undefined },
    });

    const items = response.data.items.map((issue) => mapEntityTimestamps(issue));

    if (!params) {
        return items;
    }

    return {
        ...response.data,
        items,
    };
}

export const createIssue = async (payload: IssueCreateInput) =>
    mapEntityTimestamps((await api.post<EntityWithRawTimestamps<IssueDto>>("/issues", payload)).data);

export const updateIssue = async (id: number, payload: IssueUpdateInput) =>
    mapEntityTimestamps((await api.put<EntityWithRawTimestamps<IssueDto>>(`/issues/${id}`, payload)).data);

export const deleteIssue = async (id: number) =>
    mapEntityTimestamps((await api.delete<EntityWithRawTimestamps<IssueDto>>(`/issues/${id}`)).data);
