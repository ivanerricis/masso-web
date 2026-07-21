import { getApiErrorMessage, listCollaborators } from "@/lib/api";
import type { CollaboratorDto } from "@/types/dtos";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type UseCollaboratorsRowsParams = {
    searchText: string;
    currentPage: number;
    pageSize: number;
};

export const useCollaboratorsRows = ({ searchText, currentPage, pageSize }: UseCollaboratorsRowsParams) => {
    const [collaboratorRows, setCollaboratorRows] = useState<CollaboratorDto[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    const loadCollaborators = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await listCollaborators({ page: currentPage, pageSize, search: searchText });
            setCollaboratorRows(response.items);
            setTotalItems(response.totalItems);
            setTotalPages(response.totalPages);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i collaboratori"));
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, searchText]);

    useEffect(() => {
        void loadCollaborators();
    }, [loadCollaborators]);

    return {
        collaboratorRows,
        totalItems,
        totalPages,
        isLoading,
        loadCollaborators,
    };
};
