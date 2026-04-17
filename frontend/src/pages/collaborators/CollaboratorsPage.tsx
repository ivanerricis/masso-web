import CreateEntityButton from "@/components/create-entity-button";
import CreateCollaboratorDialog from "@/components/dialogs/create/createCollaboratorDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import PageHeader from "@/components/page-header";
import { createCollaborator, deleteCollaborator, getApiErrorMessage, updateCollaborator } from "@/lib/api";
import { useEffect, useState } from "react";
import type { CollaboratorDto } from "@/types/dtos";
import { toast } from "sonner";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { useNavigate } from "react-router-dom";
import { collaboratorColumns } from "./components/collaborator-columns";
import CollaboratorsFilters from "./components/collaborators-filters";
import CollaboratorsTable from "./components/collaborators-table";
import { useCollaboratorsRows } from "./hooks/useCollaboratorsRows";

const CollaboratorsPage = () => {
    const navigate = useNavigate();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [collaboratorToEdit, setCollaboratorToEdit] = useState<CollaboratorDto | null>(null);
    const [collaboratorToDelete, setCollaboratorToDelete] = useState<CollaboratorDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { collaboratorRows, visibleCollaboratorRows, isLoading, loadCollaborators } = useCollaboratorsRows({ searchText });

    const handleCreateCollaborator = async (values: Record<string, string | boolean>) => {
        await createCollaborator({
            firstName: String(values.firstName).trim(),
            lastName: String(values.lastName).trim() === "" ? null : String(values.lastName).trim(),
            phoneNumber: String(values.phoneNumber).trim() === "" ? null : String(values.phoneNumber).trim(),
        });

        await loadCollaborators();
    };

    const handleOpenDeleteDialog = (collaborator: CollaboratorDto) => {
        setCollaboratorToDelete(collaborator);
        setIsDeleteDialogOpen(true);
    };

    const handleOpenEditDialog = (id: number) => {
        const collaborator = collaboratorRows.find((item) => item.id === id);

        if (!collaborator) {
            toast.error("Collaboratore non trovato");
            return;
        }

        setCollaboratorToEdit(collaborator);
        setIsEditDialogOpen(true);
    };

    const handleEditCollaborator = async (values: Record<string, string | boolean>) => {
        if (!collaboratorToEdit) {
            return;
        }

        await updateCollaborator(collaboratorToEdit.id, {
            firstName: String(values.firstName).trim(),
            lastName: String(values.lastName).trim() === "" ? null : String(values.lastName).trim(),
            phoneNumber: String(values.phoneNumber).trim() === "" ? null : String(values.phoneNumber).trim(),
        });

        await loadCollaborators();
    };

    const handleOpenCollaborator = (id: number) => {
        navigate(`/collaborators/${id}`);
    };

    const handleDeleteCollaborator = async () => {
        if (!collaboratorToDelete || isDeleting) {
            return;
        }

        try {
            setIsDeleting(true);
            await deleteCollaborator(collaboratorToDelete.id);
            toast.success("Collaboratore eliminato con successo");
            setIsDeleteDialogOpen(false);
            setCollaboratorToDelete(null);
            await loadCollaborators();
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile eliminare il collaboratore"));
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        void loadCollaborators();
    }, []);

    return (
        <div className="flex flex-col gap-4 w-full">
            <PageHeader
                title="Collaboratori"
                description="Gestisci i collaboratori del laboratorio."
                action={<CreateEntityButton label="Crea nuovo collaboratore" onClick={() => setIsCreateDialogOpen(true)} />}
            />

            <CreateCollaboratorDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSubmit={handleCreateCollaborator}
            />

            <CreateCollaboratorDialog
                open={isEditDialogOpen}
                onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) {
                        setCollaboratorToEdit(null);
                    }
                }}
                mode="edit"
                initialValues={collaboratorToEdit}
                onSubmit={handleEditCollaborator}
            />

            <ConfirmDeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open);
                    if (!open) {
                        setCollaboratorToDelete(null);
                    }
                }}
                title="Elimina collaboratore"
                description={
                    collaboratorToDelete
                        ? `Sei sicuro di voler eliminare il collaboratore ${collaboratorToDelete.firstName} ${collaboratorToDelete.lastName ?? ""}?`
                        : "Sei sicuro di voler eliminare questo collaboratore?"
                }
                isDeleting={isDeleting}
                onConfirm={handleDeleteCollaborator}
            />

            <CollaboratorsFilters searchText={searchText} onSearchTextChange={setSearchText} />

            {isLoading && collaboratorRows.length === 0 ? (
                <TableLoadingSkeleton columns={collaboratorColumns.length} />
            ) : (
                <CollaboratorsTable
                    columns={collaboratorColumns}
                    rows={visibleCollaboratorRows}
                    onOpenCollaborator={handleOpenCollaborator}
                    onEditCollaborator={handleOpenEditDialog}
                    onDeleteCollaborator={handleOpenDeleteDialog}
                />
            )}
        </div>
    );
}

export default CollaboratorsPage;