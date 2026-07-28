import { listReports } from "@/lib/api";
import type { ReportDto } from "@/types/dtos";
import { useCallback } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaginatedRows } from "@/hooks/usePaginatedRows";
import type { ReportVisibilityFilter } from "../components/types";

type UseReportsRowsParams = {
    searchText: string;
    visibilityFilter: ReportVisibilityFilter;
    dateFrom?: string;
    dateTo?: string;
    currentPage: number;
    pageSize: number;
};

export const useReportsRows = ({
    searchText,
    visibilityFilter,
    dateFrom,
    dateTo,
    currentPage,
    pageSize,
}: UseReportsRowsParams) => {
    const debouncedSearchText = useDebouncedValue(searchText);
    const { rows, totalItems, totalPages, isLoading, reload, updateRow } = usePaginatedRows<ReportDto>({
        fetchRows: () =>
            listReports({
                page: currentPage,
                pageSize,
                search: debouncedSearchText,
                visibility: visibilityFilter,
                dateFrom,
                dateTo,
            }),
        queryKey: [currentPage, pageSize, debouncedSearchText, visibilityFilter, dateFrom, dateTo],
        errorMessage: "Impossibile caricare i rapporti",
        initialLoading: false,
    });

    const updateReportRow = useCallback(
        (reportId: number, updater: (report: ReportDto) => ReportDto) => {
            updateRow((report) => report.id === reportId, updater);
        },
        [updateRow]
    );

    return {
        reportRows: rows,
        totalItems,
        totalPages,
        isLoading,
        loadReports: reload,
        updateReportRow,
    };
};
