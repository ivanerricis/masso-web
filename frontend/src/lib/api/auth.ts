import { api } from "./client";

export type UserDto = {
    id: number;
    username: string;
    createdAt: string;
    mustChangePassword: boolean;
};

export const login = async (username: string, password: string) =>
    (await api.post<UserDto>("/auth/login", { username, password })).data;

export const logout = async () => {
    await api.post("/auth/logout");
};

export const getMe = async () => (await api.get<UserDto>("/auth/me")).data;

export type ChangePasswordInput = {
    currentPassword: string;
    newPassword: string;
};

export const changeOwnPassword = async (payload: ChangePasswordInput) => {
    await api.put("/auth/password", payload);
};
