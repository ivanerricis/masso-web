import { getApiErrorMessage, listTechnicians } from "@/lib/api";
import type { TechnicianDto } from "@/types/dtos";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type UseTechniciansRowsParams = {
    searchText: string;
    currentPage: number;
    pageSize: number;
};

export const useTechniciansRows = ({ searchText, currentPage, pageSize }: UseTechniciansRowsParams) => {
    const [technicianRows, setTechnicianRows] = useState<TechnicianDto[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const loadTechnicians = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await listTechnicians({ page: currentPage, pageSize, search: searchText });
            setTechnicianRows(response.items);
            setTotalItems(response.totalItems);
            setTotalPages(response.totalPages);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i tecnici"));
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, searchText]);

    useEffect(() => {
        void loadTechnicians();
    }, [loadTechnicians]);

    return {
        technicianRows,
        totalItems,
        totalPages,
        isLoading,
        loadTechnicians,
    };
};
