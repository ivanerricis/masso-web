import { listTechnicians } from "@/lib/api";
import type { TechnicianDto } from "@/types/dtos";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaginatedRows } from "@/hooks/usePaginatedRows";

type UseTechniciansRowsParams = {
    searchText: string;
    currentPage: number;
    pageSize: number;
};

export const useTechniciansRows = ({ searchText, currentPage, pageSize }: UseTechniciansRowsParams) => {
    const debouncedSearchText = useDebouncedValue(searchText);
    const { rows, totalItems, totalPages, isLoading, reload } = usePaginatedRows<TechnicianDto>({
        fetchRows: () => listTechnicians({ page: currentPage, pageSize, search: debouncedSearchText }),
        queryKey: [currentPage, pageSize, debouncedSearchText],
        errorMessage: "Impossibile caricare i tecnici",
    });

    return {
        technicianRows: rows,
        totalItems,
        totalPages,
        isLoading,
        loadTechnicians: reload,
    };
};
