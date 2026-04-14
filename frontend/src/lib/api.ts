import axios from "axios";
import type {
    CollaboratorDto,
    CustomerDto,
    DeviceDto,
    IssueDto,
    ReportTechnicianDto,
    TechnicianDto,
} from "@/types/dtos";

const apiBaseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export const api = axios.create({
    baseURL: apiBaseURL,
});

type EntityWithRawTimestamps<T> = Omit<T, "createdAt" | "updatedAt"> & {
    created_at: string;
    updated_at: string | null;
};

const mapEntityTimestamps = <T extends { created_at: string; updated_at: string | null }>(
    entity: T
) => {
    const { created_at, updated_at, ...rest } = entity;

    return {
        ...rest,
        createdAt: created_at,
        updatedAt: updated_at,
    };
};

export type CustomerCreateInput = {
    firstName: string;
    lastName?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    vatNumber?: string | null;
};

export type CollaboratorCreateInput = {
    firstName: string;
    lastName?: string | null;
    phoneNumber?: string | null;
};

export type DeviceCreateInput = {
    name: string;
};

export type IssueCreateInput = {
    description: string;
};

export type ReportEntityDto = {
    id: number;
    note: string | null;
    password: string | null;
    issueDescription: string | null;
    serviceDescription: string | null;
    dataBackup: boolean;
    charger: boolean;
    closed: boolean;
    toInvoice: boolean;
    price: number;
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
    toInvoice?: boolean;
    price?: number;
};

export type TechnicianCreateInput = {
    firstName: string;
    lastName?: string | null;
    phoneNumber?: string | null;
    vatNumber?: string | null;
};

export const listCustomers = async () => {
    const response = await api.get<EntityWithRawTimestamps<CustomerDto>[]>("/customers");
    return response.data.map((customer) => mapEntityTimestamps(customer));
};

export const createCustomer = async (payload: CustomerCreateInput) =>
    mapEntityTimestamps((await api.post<EntityWithRawTimestamps<CustomerDto>>("/customers", payload)).data);

export const deleteCustomer = async (id: number) =>
    mapEntityTimestamps((await api.delete<EntityWithRawTimestamps<CustomerDto>>(`/customers/${id}`)).data);

export const listCollaborators = async () => {
    const response = await api.get<EntityWithRawTimestamps<CollaboratorDto>[]>("/collaborators");
    return response.data.map((collaborator) => mapEntityTimestamps(collaborator));
};

export const createCollaborator = async (payload: CollaboratorCreateInput) =>
    mapEntityTimestamps((await api.post<EntityWithRawTimestamps<CollaboratorDto>>("/collaborators", payload)).data);

export const deleteCollaborator = async (id: number) =>
    mapEntityTimestamps((await api.delete<EntityWithRawTimestamps<CollaboratorDto>>(`/collaborators/${id}`)).data);

export const listDevices = async () => {
    const response = await api.get<EntityWithRawTimestamps<DeviceDto>[]>("/devices");
    return response.data.map((device) => mapEntityTimestamps(device));
};

export const createDevice = async (payload: DeviceCreateInput) =>
    mapEntityTimestamps((await api.post<EntityWithRawTimestamps<DeviceDto>>("/devices", payload)).data);

export const deleteDevice = async (id: number) =>
    mapEntityTimestamps((await api.delete<EntityWithRawTimestamps<DeviceDto>>(`/devices/${id}`)).data);

export const listIssues = async () => {
    const response = await api.get<EntityWithRawTimestamps<IssueDto>[]>("/issues");
    return response.data.map((issue) => mapEntityTimestamps(issue));
};

export const createIssue = async (payload: IssueCreateInput) =>
    mapEntityTimestamps((await api.post<EntityWithRawTimestamps<IssueDto>>("/issues", payload)).data);

export const deleteIssue = async (id: number) =>
    mapEntityTimestamps((await api.delete<EntityWithRawTimestamps<IssueDto>>(`/issues/${id}`)).data);

export const listReports = async () => (await api.get<ReportEntityDto[]>("/reports")).data;

export const createReport = async (payload: ReportCreateInput) =>
    (await api.post<ReportEntityDto>("/reports", payload)).data;

export const deleteReport = async (id: number) =>
    (await api.delete<ReportEntityDto>(`/reports/${id}`)).data;

export const listReportTechnicians = async () =>
    (await api.get<ReportTechnicianDto[]>("/report-technicians")).data;

export const listTechnicians = async () => {
    const response = await api.get<EntityWithRawTimestamps<TechnicianDto>[]>("/technicians");
    return response.data.map((technician) => mapEntityTimestamps(technician));
};

export const createTechnician = async (payload: TechnicianCreateInput) =>
    mapEntityTimestamps((await api.post<EntityWithRawTimestamps<TechnicianDto>>("/technicians", payload)).data);

export const deleteTechnician = async (id: number) =>
    mapEntityTimestamps((await api.delete<EntityWithRawTimestamps<TechnicianDto>>(`/technicians/${id}`)).data);

export const getApiErrorMessage = (error: unknown, fallbackMessage = "Operazione non riuscita") => {
    if (axios.isAxiosError<{ message?: string }>(error)) {
        return error.response?.data?.message ?? error.message ?? fallbackMessage;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallbackMessage;
};