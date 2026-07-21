import { api } from "./client";

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
};

export type BackupSettingsInput = Pick<
    BackupSettingsDto,
    "dumpEnabled" | "autoEnabled" | "frequencyDays" | "runAt" | "outputDir" | "maxBackupsToKeep"
>;

export const getBackupSettings = async () =>
    (await api.get<BackupSettingsDto>("/settings/backup")).data;

export const updateBackupSettings = async (payload: BackupSettingsInput) =>
    (await api.put<BackupSettingsDto>("/settings/backup", payload)).data;

export const runBackupNow = async () =>
    (await api.post<BackupSettingsDto & { message: string }>("/settings/backup/run")).data;

export const getBackupDownloadUrl = () => api.getUri({ url: "/settings/backup/download" });

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
