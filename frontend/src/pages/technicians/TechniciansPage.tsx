import CreateEntityButton from "@/components/create-entity-button";
import CreateTechnicianDialog from "@/components/dialogs/create/createTechnicianDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import PageHeader from "@/components/page-header";
import TablePagination from "@/components/table-pagination";
import LoadingPage from "@/components/loadingPage";
import { createTechnician, deleteTechnician, getApiErrorMessage, updateTechnician } from "@/lib/api";
import { useEffect, useState } from "react";
import type { TechnicianDto } from "@/types/dtos";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { technicianColumns } from "./components/technician-columns";
import TechniciansFilters from "./components/technicians-filters";
import TechniciansTable from "./components/technicians-table";
import { useTechniciansRows } from "./hooks/useTechniciansRows";
import { useTablePagination } from "@/hooks/useTablePagination";

const TechniciansPage = () => {
    const navigate = useNavigate();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [technicianToEdit, setTechnicianToEdit] = useState<TechnicianDto | null>(null);
    const [technicianToDelete, setTechnicianToDelete] = useState<TechnicianDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const pageSize = 10;
    const { currentPage, setCurrentPage } = useTablePagination({ resetDependencies: [searchText] });
    const { technicianRows, totalItems, totalPages, isLoading, loadTechnicians } = useTechniciansRows({
        searchText,
        currentPage,
        pageSize,
    });

    const handleCreateTechnician = async (values: Record<string, string | boolean>) => {
        await createTechnician({
            firstName: String(values.firstName).trim(),
            lastName: String(values.lastName).trim() === "" ? null : String(values.lastName).trim(),
            phoneNumber: String(values.phoneNumber).trim() === "" ? null : String(values.phoneNumber).trim(),
            vatNumber: String(values.vatNumber).trim() === "" ? null : String(values.vatNumber).trim(),
        });

        await loadTechnicians();
    };

    const handleOpenDeleteDialog = (technician: TechnicianDto) => {
        setTechnicianToDelete(technician);
        setIsDeleteDialogOpen(true);
    };

    const handleOpenEditDialog = (id: number) => {
        const technician = technicianRows.find((item) => item.id === id);

        if (!technician) {
            toast.error("Tecnico non trovato");
            return;
        }

        setTechnicianToEdit(technician);
        setIsEditDialogOpen(true);
    };

    const handleEditTechnician = async (values: Record<string, string | boolean>) => {
        if (!technicianToEdit) {
            return;
        }

        await updateTechnician(technicianToEdit.id, {
            firstName: String(values.firstName).trim(),
            lastName: String(values.lastName).trim() === "" ? null : String(values.lastName).trim(),
            phoneNumber: String(values.phoneNumber).trim() === "" ? null : String(values.phoneNumber).trim(),
            vatNumber: String(values.vatNumber).trim() === "" ? null : String(values.vatNumber).trim(),
        });

        await loadTechnicians();
    };

    const handleOpenTechnician = (id: number) => {
        navigate(`/technicians/${id}`);
    };

    const handleDeleteTechnician = async () => {
        if (!technicianToDelete || isDeleting) {
            return;
        }

        try {
            setIsDeleting(true);
            await deleteTechnician(technicianToDelete.id);
            toast.success("Tecnico eliminato con successo");
            setIsDeleteDialogOpen(false);
            setTechnicianToDelete(null);
            await loadTechnicians();
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile eliminare il tecnico"));
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        void loadTechnicians();
    }, [loadTechnicians]);

    return (
        <div className="relative flex flex-col gap-4 w-full">
            <PageHeader
                title="Tecnici"
                description="Gestisci i tecnici del laboratorio."
                action={<CreateEntityButton label="Crea nuovo tecnico" onClick={() => setIsCreateDialogOpen(true)} />}
            />

            <CreateTechnicianDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSubmit={handleCreateTechnician}
            />

            <CreateTechnicianDialog
                open={isEditDialogOpen}
                onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) {
                        setTechnicianToEdit(null);
                    }
                }}
                mode="edit"
                initialValues={technicianToEdit}
                onSubmit={handleEditTechnician}
            />

            <ConfirmDeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open);
                    if (!open) {
                        setTechnicianToDelete(null);
                    }
                }}
                title="Elimina tecnico"
                description={
                    technicianToDelete
                        ? `Sei sicuro di voler eliminare il tecnico ${technicianToDelete.firstName} ${technicianToDelete.lastName ?? ""}?`
                        : "Sei sicuro di voler eliminare questo tecnico?"
                }
                isDeleting={isDeleting}
                onConfirm={handleDeleteTechnician}
            />

            <TechniciansFilters searchText={searchText} onSearchTextChange={setSearchText} />

            <div className="flex flex-col gap-4">
                <TechniciansTable
                    columns={technicianColumns}
                    rows={technicianRows}
                    onOpenTechnician={handleOpenTechnician}
                    onEditTechnician={handleOpenEditDialog}
                    onDeleteTechnician={handleOpenDeleteDialog}
                />
                <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />
            </div>

            {isLoading ? <LoadingPage className="absolute inset-0 z-10 rounded-2xl bg-background/70 backdrop-blur-sm" /> : null}
        </div>
    );
}

export default TechniciansPage;