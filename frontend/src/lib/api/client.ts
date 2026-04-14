import axios from "axios";

const apiBaseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export const api = axios.create({
    baseURL: apiBaseURL,
});

export type EntityWithRawTimestamps<T> = Omit<T, "createdAt" | "updatedAt"> & {
    created_at: string;
    updated_at: string | null;
};

export const mapEntityTimestamps = <T extends { created_at: string; updated_at: string | null }>(
    entity: T
) => {
    const { created_at, updated_at, ...rest } = entity;

    return {
        ...rest,
        createdAt: created_at,
        updatedAt: updated_at,
    };
};
