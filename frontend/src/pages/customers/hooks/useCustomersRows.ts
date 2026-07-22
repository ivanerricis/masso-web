import { getApiErrorMessage, listCustomers } from "@/lib/api";
import type { CustomerDto } from "@/types/dtos";
import { startTransition, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type UseCustomersRowsParams = {
    searchText: string;
    currentPage: number;
    pageSize: number;
};

export const useCustomersRows = ({ searchText, currentPage, pageSize }: UseCustomersRowsParams) => {
    const [customerRows, setCustomerRows] = useState<CustomerDto[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const debouncedSearchText = useDebouncedValue(searchText);

    const loadCustomers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await listCustomers({ page: currentPage, pageSize, search: debouncedSearchText });
            setCustomerRows(response.items);
            setTotalItems(response.totalItems);
            setTotalPages(response.totalPages);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i clienti"));
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, debouncedSearchText]);

    useEffect(() => {
        startTransition(() => {
            void loadCustomers();
        });
    }, [loadCustomers]);

    return {
        customerRows,
        totalItems,
        totalPages,
        isLoading,
        loadCustomers,
    };
};
