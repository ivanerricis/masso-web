import { getApiErrorMessage, listDevices } from "@/lib/api";
import type { DeviceDto } from "@/types/dtos";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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

    const loadDevices = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await listDevices({ page: currentPage, pageSize, search: searchText });
            setDeviceRows(response.items);
            setTotalItems(response.totalItems);
            setTotalPages(response.totalPages);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i dispositivi"));
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, searchText]);

    useEffect(() => {
        void loadDevices();
    }, [loadDevices]);

    return {
        deviceRows,
        totalItems,
        totalPages,
        isLoading,
        loadDevices,
    };
};
