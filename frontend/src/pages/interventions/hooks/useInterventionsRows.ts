import { getApiErrorMessage, listInterventions } from "@/lib/api";
import type { InterventionDto } from "@/types/dtos";
import { startTransition, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { InterventionStatusFilter, InterventionTypeFilter } from "../components/types";

type UseInterventionsRowsParams = {
    searchText: string;
    statusFilter: InterventionStatusFilter;
    typeFilter: InterventionTypeFilter;
    selectedDate?: Date;
    currentPage: number;
    pageSize: number;
};

const formatDateForQuery = (date: Date) => date.toISOString().slice(0, 10);

export const useInterventionsRows = ({
    searchText,
    statusFilter,
    typeFilter,
    selectedDate,
    currentPage,
    pageSize,
}: UseInterventionsRowsParams) => {
    const [interventionRows, setInterventionRows] = useState<InterventionDto[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedSearchText = useDebouncedValue(searchText);

    const loadInterventions = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await listInterventions({
                page: currentPage,
                pageSize,
                search: debouncedSearchText,
                status: statusFilter,
                type: typeFilter,
                date: selectedDate ? formatDateForQuery(selectedDate) : undefined,
            });

            setInterventionRows(response.items);
            setTotalItems(response.totalItems);
            setTotalPages(response.totalPages);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare gli interventi"));
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, debouncedSearchText, statusFilter, typeFilter, selectedDate]);

    useEffect(() => {
        startTransition(() => {
            void loadInterventions();
        });
    }, [loadInterventions]);

    const updateInterventionRow = useCallback(
        (interventionId: number, updater: (intervention: InterventionDto) => InterventionDto) => {
            setInterventionRows((currentRows) =>
                currentRows.map((intervention) => (intervention.id === interventionId ? updater(intervention) : intervention))
            );
        },
        []
    );

    return {
        interventionRows,
        totalItems,
        totalPages,
        isLoading,
        loadInterventions,
        updateInterventionRow,
    };
};
