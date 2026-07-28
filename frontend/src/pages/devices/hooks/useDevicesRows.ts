import { listDevices } from "@/lib/api";
import type { DeviceDto } from "@/types/dtos";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaginatedRows } from "@/hooks/usePaginatedRows";

type UseDevicesRowsParams = {
    searchText: string;
    currentPage: number;
    pageSize: number;
};

export const useDevicesRows = ({ searchText, currentPage, pageSize }: UseDevicesRowsParams) => {
    const debouncedSearchText = useDebouncedValue(searchText);
    const { rows, totalItems, totalPages, isLoading, reload } = usePaginatedRows<DeviceDto>({
        fetchRows: () => listDevices({ page: currentPage, pageSize, search: debouncedSearchText }),
        queryKey: [currentPage, pageSize, debouncedSearchText],
        errorMessage: "Impossibile caricare i dispositivi",
    });

    return {
        deviceRows: rows,
        totalItems,
        totalPages,
        isLoading,
        loadDevices: reload,
    };
};
