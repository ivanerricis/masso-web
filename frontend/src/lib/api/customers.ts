import type { CustomerDto } from "@/types/dtos";
import { api, mapEntityTimestamps } from "./client";
import type { EntityWithRawTimestamps } from "./client";
import type { PaginatedResponse } from "./client";

export type CustomerCreateInput = {
    firstName: string;
    lastName?: string | null;
    phoneNumber?: string | null;
    phoneNumberSecondary?: string | null;
    email?: string | null;
};

export type CustomerUpdateInput = Partial<CustomerCreateInput>;

export type ListCustomersParams = {
    page?: number;
    pageSize?: number;
    search?: string;
};

export function listCustomers(): Promise<CustomerDto[]>;
export function listCustomers(params: ListCustomersParams): Promise<PaginatedResponse<CustomerDto>>;
export async function listCustomers(params?: ListCustomersParams) {
    if (!params) {
        const response = await api.get<EntityWithRawTimestamps<CustomerDto>[]>("/customers");
        return response.data.map((customer) => mapEntityTimestamps(customer));
    }

    const response = await api.get<PaginatedResponse<EntityWithRawTimestamps<CustomerDto>>>("/customers", {
        params: { page: params.page ?? 1, pageSize: params.pageSize ?? 1000, search: params.search?.trim() || undefined },
    });

    const items = response.data.items.map((customer) => mapEntityTimestamps(customer));

    return {
        ...response.data,
        items,
    };
}

export const createCustomer = async (payload: CustomerCreateInput) =>
    mapEntityTimestamps((await api.post<EntityWithRawTimestamps<CustomerDto>>("/customers", payload)).data);

export const updateCustomer = async (id: number, payload: CustomerUpdateInput) =>
    mapEntityTimestamps((await api.put<EntityWithRawTimestamps<CustomerDto>>(`/customers/${id}`, payload)).data);

export const deleteCustomer = async (id: number) =>
    mapEntityTimestamps((await api.delete<EntityWithRawTimestamps<CustomerDto>>(`/customers/${id}`)).data);

export const getCustomerReportsPrintUrl = (id: number) =>
    api.getUri({ url: `/customers/${id}/reports/print` });

export const getCustomerInterventionsPrintUrl = (id: number) =>
    api.getUri({ url: `/customers/${id}/interventions/print` });
