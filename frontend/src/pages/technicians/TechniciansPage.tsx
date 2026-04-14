import CreateEntityButton from "@/components/create-entity-button";
import CreateTechnicianDialog from "@/components/dialogs/create/createTechnicianDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import PageHeader from "@/components/page-header";
import { createTechnician, deleteTechnician, getApiErrorMessage } from "@/lib/api";
import { useEffect, useState } from "react";
import type { TechnicianDto } from "@/types/dtos";
import { toast } from "sonner";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { useNavigate } from "react-router-dom";
import { technicianColumns } from "./components/technician-columns";
import TechniciansFilters from "./components/technicians-filters";
import TechniciansTable from "./components/technicians-table";
import { useTechniciansRows } from "./hooks/useTechniciansRows";

const TechniciansPage = () => {
    const navigate = useNavigate();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [technicianToDelete, setTechnicianToDelete] = useState<TechnicianDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { technicianRows, visibleTechnicianRows, isLoading, loadTechnicians } = useTechniciansRows({ searchText });

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
    }, []);

    return (
        <div className="flex flex-col gap-4">
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

            {isLoading && technicianRows.length === 0 ? (
                <TableLoadingSkeleton columns={technicianColumns.length} />
            ) : (
                <TechniciansTable
                    columns={technicianColumns}
                    rows={visibleTechnicianRows}
                    onOpenTechnician={handleOpenTechnician}
                    onEditTechnician={() => toast.info("Modifica non ancora disponibile")}
                    onDeleteTechnician={handleOpenDeleteDialog}
                />
            )}
        </div>
    );
}

export default TechniciansPage;