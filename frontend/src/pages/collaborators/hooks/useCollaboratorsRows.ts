import { getApiErrorMessage, listCollaborators } from "@/lib/api";
import type { CollaboratorDto } from "@/types/dtos";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

type UseCollaboratorsRowsParams = {
    searchText: string;
};

export const useCollaboratorsRows = ({ searchText }: UseCollaboratorsRowsParams) => {
    const [collaboratorRows, setCollaboratorRows] = useState<CollaboratorDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadCollaborators = useCallback(async () => {
        setIsLoading(true);
        try {
            const collaborators = await listCollaborators();
            setCollaboratorRows(collaborators);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i collaboratori"));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const visibleCollaboratorRows = useMemo(() => {
        return collaboratorRows.filter((collaborator) => {
            const query = searchText.trim().toLowerCase();
            if (!query) {
                return true;
            }

            return [
                String(collaborator.id),
                collaborator.firstName,
                collaborator.lastName ?? "",
                collaborator.phoneNumber ?? "",
            ]
                .join(" ")
                .toLowerCase()
                .includes(query);
        });
    }, [collaboratorRows, searchText]);

    return {
        collaboratorRows,
        visibleCollaboratorRows,
        isLoading,
        loadCollaborators,
    };
};
