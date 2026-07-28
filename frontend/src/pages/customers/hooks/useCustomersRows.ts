import { listCustomers } from "@/lib/api";
import type { CustomerDto } from "@/types/dtos";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaginatedRows } from "@/hooks/usePaginatedRows";

type UseCustomersRowsParams = {
    searchText: string;
    currentPage: number;
    pageSize: number;
};

export const useCustomersRows = ({ searchText, currentPage, pageSize }: UseCustomersRowsParams) => {
    const debouncedSearchText = useDebouncedValue(searchText);
    const { rows, totalItems, totalPages, isLoading, reload } = usePaginatedRows<CustomerDto>({
        fetchRows: () => listCustomers({ page: currentPage, pageSize, search: debouncedSearchText }),
        queryKey: [currentPage, pageSize, debouncedSearchText],
        errorMessage: "Impossibile caricare i clienti",
    });

    return {
        customerRows: rows,
        totalItems,
        totalPages,
        isLoading,
        loadCustomers: reload,
    };
};
