import { getApiErrorMessage, listIssues } from "@/lib/api";
import type { IssueDto } from "@/types/dtos";
import { startTransition, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type UseIssuesRowsParams = {
    searchText: string;
    currentPage: number;
    pageSize: number;
};

export const useIssuesRows = ({ searchText, currentPage, pageSize }: UseIssuesRowsParams) => {
    const [issueRows, setIssueRows] = useState<IssueDto[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const debouncedSearchText = useDebouncedValue(searchText);

    const loadIssues = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await listIssues({ page: currentPage, pageSize, search: debouncedSearchText });
            setIssueRows(response.items);
            setTotalItems(response.totalItems);
            setTotalPages(response.totalPages);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i difetti"));
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, debouncedSearchText]);

    useEffect(() => {
        startTransition(() => {
            void loadIssues();
        });
    }, [loadIssues]);

    return {
        issueRows,
        totalItems,
        totalPages,
        isLoading,
        loadIssues,
    };
};
