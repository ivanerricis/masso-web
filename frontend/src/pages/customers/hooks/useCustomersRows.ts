import { getApiErrorMessage, listCustomers } from "@/lib/api";
import type { CustomerDto } from "@/types/dtos";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

type UseCustomersRowsParams = {
    searchText: string;
};

export const useCustomersRows = ({ searchText }: UseCustomersRowsParams) => {
    const [customerRows, setCustomerRows] = useState<CustomerDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadCustomers = useCallback(async () => {
        setIsLoading(true);
        try {
            const customers = await listCustomers();
            setCustomerRows(customers);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i clienti"));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const visibleCustomerRows = useMemo(() => {
        return customerRows.filter((customer) => {
            const query = searchText.trim().toLowerCase();
            if (!query) {
                return true;
            }

            return [
                String(customer.id),
                customer.firstName,
                customer.lastName ?? "",
                customer.phoneNumber ?? "",
                customer.email ?? "",
                customer.vatNumber ?? "",
            ]
                .join(" ")
                .toLowerCase()
                .includes(query);
        });
    }, [customerRows, searchText]);

    return {
        customerRows,
        visibleCustomerRows,
        isLoading,
        loadCustomers,
    };
};
