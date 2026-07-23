import { api } from "./client";
import type { PaginatedResponse } from "./client";

export type BackupSettingsDto = {
    dumpEnabled: boolean;
    autoEnabled: boolean;
    frequencyDays: number;
    runAt: string;
    outputDir: string;
    maxBackupsToKeep: number;
    nextRunAt: string | null;
    lastRunAt: string | null;
    lastRunStatus: "idle" | "success" | "failed";
    lastError: string | null;
    lastDumpPath: string | null;
    smbEnabled: boolean;
    smbHost: string;
    smbShare: string;
    smbPath: string;
    smbDomain: string;
    smbPort: number;
    smbUsername: string;
    smbPasswordSet: boolean;
    smbLastRunAt: string | null;
    smbLastStatus: "idle" | "success" | "failed";
    smbLastError: string | null;
};

export type BackupSettingsInput = Pick<
    BackupSettingsDto,
    | "dumpEnabled"
    | "autoEnabled"
    | "frequencyDays"
    | "runAt"
    | "outputDir"
    | "maxBackupsToKeep"
    | "smbEnabled"
    | "smbHost"
    | "smbShare"
    | "smbPath"
    | "smbDomain"
    | "smbPort"
    | "smbUsername"
> & { smbPassword?: string };

export const getBackupSettings = async () =>
    (await api.get<BackupSettingsDto>("/settings/backup")).data;

export const updateBackupSettings = async (payload: BackupSettingsInput) =>
    (await api.put<BackupSettingsDto>("/settings/backup", payload)).data;

export const runBackupNow = async () =>
    (await api.post<BackupSettingsDto & { message: string }>("/settings/backup/run")).data;

export type SmbConnectionTestInput = {
    host: string;
    share: string;
    path: string;
    domain: string;
    port: number;
    username: string;
    password: string;
};

export const testSmbConnection = async (payload: SmbConnectionTestInput) =>
    (await api.post<{ message: string }>("/settings/backup/smb/test", payload)).data;

export type BackupDumpFileDto = {
    fileName: string;
    sizeBytes: number;
    createdAt: string;
};

export const listBackupDumps = async () =>
    (await api.get<BackupDumpFileDto[]>("/settings/backup/list")).data;

export const getBackupDumpDownloadUrl = (fileName: string) =>
    api.getUri({ url: `/settings/backup/download/${encodeURIComponent(fileName)}` });

export type LogoStatusDto = {
    hasCustomLogo: boolean;
    updatedAt: string | null;
};

export const getLogoStatus = async () => (await api.get<LogoStatusDto>("/settings/logo")).data;

export const uploadLogo = async (file: File) => {
    const formData = new FormData();
    formData.append("logo", file);

    return (await api.post<LogoStatusDto>("/settings/logo", formData)).data;
};

export const resetLogo = async () => (await api.delete<LogoStatusDto>("/settings/logo")).data;

export type LogFileDto = {
    dayKey: string;
    sizeBytes: number;
    updatedAt: string;
};

export type LogEntryDto = {
    timestamp: string;
    ip: string;
    action: string;
    status: number;
    error: string | null;
};

export const listLogFiles = async () => (await api.get<LogFileDto[]>("/settings/logs")).data;

export type ListLogEntriesParams = {
    page?: number;
    pageSize?: number;
    search?: string;
};

export const listLogEntries = async (dayKey: string, params: ListLogEntriesParams = {}) =>
    (
        await api.get<PaginatedResponse<LogEntryDto>>(`/settings/logs/${encodeURIComponent(dayKey)}`, {
            params: {
                page: params.page ?? 1,
                pageSize: params.pageSize ?? 50,
                search: params.search?.trim() || undefined,
            },
        })
    ).data;

export const getLogDownloadUrl = (dayKey: string) =>
    api.getUri({ url: `/settings/logs/${encodeURIComponent(dayKey)}/download` });
