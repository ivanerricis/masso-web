import type { CustomerDto } from "@/types/dtos";
import { api, mapEntityTimestamps } from "./client";
import type { EntityWithRawTimestamps } from "./client";

export type CustomerCreateInput = {
    firstName: string;
    lastName?: string | null;
    phoneNumber?: string | null;
    phoneNumberSecondary?: string | null;
    email?: string | null;
};

export type CustomerUpdateInput = Partial<CustomerCreateInput>;

export const listCustomers = async () => {
    const response = await api.get<EntityWithRawTimestamps<CustomerDto>[]>("/customers");
    return response.data.map((customer) => mapEntityTimestamps(customer));
};

export const createCustomer = async (payload: CustomerCreateInput) =>
    mapEntityTimestamps((await api.post<EntityWithRawTimestamps<CustomerDto>>("/customers", payload)).data);

export const updateCustomer = async (id: number, payload: CustomerUpdateInput) =>
    mapEntityTimestamps((await api.put<EntityWithRawTimestamps<CustomerDto>>(`/customers/${id}`, payload)).data);

export const deleteCustomer = async (id: number) =>
    mapEntityTimestamps((await api.delete<EntityWithRawTimestamps<CustomerDto>>(`/customers/${id}`)).data);
