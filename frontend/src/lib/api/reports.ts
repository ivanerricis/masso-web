import { api } from "./client";
import type { PaymentMethod } from "@/types/dtos";
import type { PaginatedResponse } from "./client";
import type { ReportDto } from "@/types/dtos";

export type ReportEntityDto = {
    id: number;
    note: string | null;
    password: string | null;
    issueDescription: string | null;
    serviceDescription: string | null;
    dataBackup: boolean;
    charger: boolean;
    closed: boolean;
    price: number;
    paymentMethod: PaymentMethod;
    deviceId: number;
    issueId: number;
    collaboratorId: number | null;
    customerId: number;
    created_at: string;
    updated_at: string | null;
};

export type ReportCreateInput = {
    deviceId: number;
    issueId: number;
    collaboratorId?: number | null;
    customerId: number;
    note?: string | null;
    password?: string | null;
    issueDescription?: string | null;
    serviceDescription?: string | null;
    dataBackup?: boolean;
    charger?: boolean;
    closed?: boolean;
    paymentMethod?: PaymentMethod;
    price?: number;
};

export type ListReportsParams = {
    page?: number;
    pageSize?: number;
    search?: string;
    visibility?: "all" | "open" | "closed";
    date?: string;
};

export function listReports(): Promise<ReportDto[]>;
export function listReports(params: ListReportsParams): Promise<PaginatedResponse<ReportDto>>;
export async function listReports(params?: ListReportsParams) {
    if (!params) {
        const response = await api.get<ReportDto[]>("/reports");
        return response.data;
    }

    const response = await api.get<PaginatedResponse<ReportDto>>("/reports", {
        params: {
            page: params.page ?? 1,
            pageSize: params.pageSize ?? 1000,
            search: params.search?.trim() || undefined,
            visibility: params.visibility,
            date: params.date,
        },
    });

    return response.data;
}

export const getReport = async (id: number) =>
    (await api.get<ReportEntityDto>(`/reports/${id}`)).data;

export const createReport = async (payload: ReportCreateInput) =>
    (await api.post<ReportEntityDto>("/reports", payload)).data;

export const updateReport = async (id: number, payload: Partial<ReportCreateInput>) =>
    (await api.put<ReportEntityDto>(`/reports/${id}`, payload)).data;

export const deleteReport = async (id: number) =>
    (await api.delete<ReportEntityDto>(`/reports/${id}`)).data;

export const printReportPdf = async (id: number) =>
    (await api.get<Blob>(`/reports/${id}/print`, { responseType: "blob" })).data;

export const getReportPrintUrl = (id: number) =>
    api.getUri({ url: `/reports/${id}/print` });
