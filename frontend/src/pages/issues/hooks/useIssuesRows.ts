import { listIssues } from "@/lib/api";
import type { IssueDto } from "@/types/dtos";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaginatedRows } from "@/hooks/usePaginatedRows";

type UseIssuesRowsParams = {
    searchText: string;
    currentPage: number;
    pageSize: number;
};

export const useIssuesRows = ({ searchText, currentPage, pageSize }: UseIssuesRowsParams) => {
    const debouncedSearchText = useDebouncedValue(searchText);
    const { rows, totalItems, totalPages, isLoading, reload } = usePaginatedRows<IssueDto>({
        fetchRows: () => listIssues({ page: currentPage, pageSize, search: debouncedSearchText }),
        queryKey: [currentPage, pageSize, debouncedSearchText],
        errorMessage: "Impossibile caricare i difetti",
    });

    return {
        issueRows: rows,
        totalItems,
        totalPages,
        isLoading,
        loadIssues: reload,
    };
};
