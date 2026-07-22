import { getApiErrorMessage, listReports } from "@/lib/api";
import type { ReportDto } from "@/types/dtos";
import { startTransition, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ReportVisibilityFilter } from "../components/types";

type UseReportsRowsParams = {
    searchText: string;
    visibilityFilter: ReportVisibilityFilter;
    selectedDate?: Date;
    currentPage: number;
    pageSize: number;
};

const formatDateForQuery = (date: Date) => date.toISOString().slice(0, 10);

export const useReportsRows = ({
    searchText,
    visibilityFilter,
    selectedDate,
    currentPage,
    pageSize,
}: UseReportsRowsParams) => {
    const [reportRows, setReportRows] = useState<ReportDto[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedSearchText = useDebouncedValue(searchText);

    const loadReports = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await listReports({
                page: currentPage,
                pageSize,
                search: debouncedSearchText,
                visibility: visibilityFilter,
                date: selectedDate ? formatDateForQuery(selectedDate) : undefined,
            });

            setReportRows(response.items);
            setTotalItems(response.totalItems);
            setTotalPages(response.totalPages);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i rapporti"));
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, debouncedSearchText, selectedDate, visibilityFilter]);

    useEffect(() => {
        startTransition(() => {
            void loadReports();
        });
    }, [loadReports]);

    const updateReportRow = useCallback(
        (reportId: number, updater: (report: ReportDto) => ReportDto) => {
            setReportRows((currentRows) => currentRows.map((report) => (report.id === reportId ? updater(report) : report)));
        },
        []
    );

    return {
        reportRows,
        totalItems,
        totalPages,
        isLoading,
        loadReports,
        updateReportRow,
    };
};