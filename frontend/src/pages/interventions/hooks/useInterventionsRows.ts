import { listInterventions } from "@/lib/api";
import type { InterventionDto } from "@/types/dtos";
import { useCallback } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaginatedRows } from "@/hooks/usePaginatedRows";
import type { InterventionStatusFilter, InterventionTypeFilter } from "../components/types";

type UseInterventionsRowsParams = {
    searchText: string;
    statusFilter: InterventionStatusFilter;
    typeFilter: InterventionTypeFilter;
    dateFrom?: string;
    dateTo?: string;
    currentPage: number;
    pageSize: number;
};

export const useInterventionsRows = ({
    searchText,
    statusFilter,
    typeFilter,
    dateFrom,
    dateTo,
    currentPage,
    pageSize,
}: UseInterventionsRowsParams) => {
    const debouncedSearchText = useDebouncedValue(searchText);
    const { rows, totalItems, totalPages, isLoading, reload, updateRow } =
        usePaginatedRows<InterventionDto>({
            fetchRows: () =>
                listInterventions({
                    page: currentPage,
                    pageSize,
                    search: debouncedSearchText,
                    status: statusFilter,
                    type: typeFilter,
                    dateFrom,
                    dateTo,
                }),
            queryKey: [
                currentPage,
                pageSize,
                debouncedSearchText,
                statusFilter,
                typeFilter,
                dateFrom,
                dateTo,
            ],
            errorMessage: "Impossibile caricare gli interventi",
            initialLoading: false,
        });

    const updateInterventionRow = useCallback(
        (interventionId: number, updater: (intervention: InterventionDto) => InterventionDto) => {
            updateRow((intervention) => intervention.id === interventionId, updater);
        },
        [updateRow]
    );

    return {
        interventionRows: rows,
        totalItems,
        totalPages,
        isLoading,
        loadInterventions: reload,
        updateInterventionRow,
    };
};
