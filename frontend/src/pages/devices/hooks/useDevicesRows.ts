import { getApiErrorMessage, listDevices } from "@/lib/api";
import type { DeviceDto } from "@/types/dtos";
import { startTransition, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type UseDevicesRowsParams = {
    searchText: string;
    currentPage: number;
    pageSize: number;
};

export const useDevicesRows = ({ searchText, currentPage, pageSize }: UseDevicesRowsParams) => {
    const [deviceRows, setDeviceRows] = useState<DeviceDto[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const debouncedSearchText = useDebouncedValue(searchText);

    const loadDevices = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await listDevices({ page: currentPage, pageSize, search: debouncedSearchText });
            setDeviceRows(response.items);
            setTotalItems(response.totalItems);
            setTotalPages(response.totalPages);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i dispositivi"));
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, debouncedSearchText]);

    useEffect(() => {
        startTransition(() => {
            void loadDevices();
        });
    }, [loadDevices]);

    return {
        deviceRows,
        totalItems,
        totalPages,
        isLoading,
        loadDevices,
    };
};
