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
