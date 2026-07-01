import { api } from "./client";
import type { PaymentMethod } from "@/types/dtos";

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

export const listReports = async () => (await api.get<ReportEntityDto[]>("/reports")).data;

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
