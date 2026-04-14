import { getApiErrorMessage, listDevices } from "@/lib/api";
import type { DeviceDto } from "@/types/dtos";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

type UseDevicesRowsParams = {
    searchText: string;
};

export const useDevicesRows = ({ searchText }: UseDevicesRowsParams) => {
    const [deviceRows, setDeviceRows] = useState<DeviceDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadDevices = useCallback(async () => {
        setIsLoading(true);
        try {
            const devices = await listDevices();
            setDeviceRows(devices);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i dispositivi"));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const visibleDeviceRows = useMemo(() => {
        return deviceRows.filter((device) => {
            const query = searchText.trim().toLowerCase();
            if (!query) {
                return true;
            }

            return [String(device.id), device.name]
                .join(" ")
                .toLowerCase()
                .includes(query);
        });
    }, [deviceRows, searchText]);

    return {
        deviceRows,
        visibleDeviceRows,
        isLoading,
        loadDevices,
    };
};
