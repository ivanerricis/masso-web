import { api } from "./client";

export type UpdateStatusDto = {
    state: "unknown" | "idle" | "running" | "success" | "failed";
    currentCommit: string | null;
    remoteCommit: string | null;
    updateAvailable: boolean;
    lastCheckedAt: string | null;
    lastUpdateAt: string | null;
    lastUpdateStatus: "success" | "failed" | null;
    lastError: string | null;
    log: string | null;
};

export const getUpdateStatus = async () => (await api.get<UpdateStatusDto>("/settings/update")).data;

export const runUpdateNow = async () => (await api.post<UpdateStatusDto>("/settings/update/run")).data;

export const checkForUpdates = async () => (await api.post<UpdateStatusDto>("/settings/update/check")).data;
