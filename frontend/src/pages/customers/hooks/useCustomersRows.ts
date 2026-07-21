import { getApiErrorMessage, listCustomers } from "@/lib/api";
import type { CustomerDto } from "@/types/dtos";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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

    const loadCustomers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await listCustomers({ page: currentPage, pageSize, search: searchText });
            setCustomerRows(response.items);
            setTotalItems(response.totalItems);
            setTotalPages(response.totalPages);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i clienti"));
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, searchText]);

    useEffect(() => {
        void loadCustomers();
    }, [loadCustomers]);

    return {
        customerRows,
        totalItems,
        totalPages,
        isLoading,
        loadCustomers,
    };
};
