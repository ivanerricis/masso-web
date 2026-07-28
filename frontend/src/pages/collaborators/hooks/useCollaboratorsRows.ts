import { listCollaborators } from "@/lib/api";
import type { CollaboratorDto } from "@/types/dtos";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaginatedRows } from "@/hooks/usePaginatedRows";

type UseCollaboratorsRowsParams = {
    searchText: string;
    currentPage: number;
    pageSize: number;
};

export const useCollaboratorsRows = ({ searchText, currentPage, pageSize }: UseCollaboratorsRowsParams) => {
    const debouncedSearchText = useDebouncedValue(searchText);
    const { rows, totalItems, totalPages, isLoading, reload } = usePaginatedRows<CollaboratorDto>({
        fetchRows: () => listCollaborators({ page: currentPage, pageSize, search: debouncedSearchText }),
        queryKey: [currentPage, pageSize, debouncedSearchText],
        errorMessage: "Impossibile caricare i collaboratori",
    });

    return {
        collaboratorRows: rows,
        totalItems,
        totalPages,
        isLoading,
        loadCollaborators: reload,
    };
};
