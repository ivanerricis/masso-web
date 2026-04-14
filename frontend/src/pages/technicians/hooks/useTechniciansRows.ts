import { getApiErrorMessage, listTechnicians } from "@/lib/api";
import type { TechnicianDto } from "@/types/dtos";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

type UseTechniciansRowsParams = {
    searchText: string;
};

export const useTechniciansRows = ({ searchText }: UseTechniciansRowsParams) => {
    const [technicianRows, setTechnicianRows] = useState<TechnicianDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadTechnicians = useCallback(async () => {
        setIsLoading(true);
        try {
            const technicians = await listTechnicians();
            setTechnicianRows(technicians);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i tecnici"));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const visibleTechnicianRows = useMemo(() => {
        return technicianRows.filter((technician) => {
            const query = searchText.trim().toLowerCase();
            if (!query) {
                return true;
            }

            return [
                String(technician.id),
                technician.firstName,
                technician.lastName ?? "",
                technician.phoneNumber ?? "",
                technician.vatNumber ?? "",
            ]
                .join(" ")
                .toLowerCase()
                .includes(query);
        });
    }, [technicianRows, searchText]);

    return {
        technicianRows,
        visibleTechnicianRows,
        isLoading,
        loadTechnicians,
    };
};
