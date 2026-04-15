import CreateEntityButton from "@/components/create-entity-button";
import CreateDeviceDialog from "@/components/dialogs/create/createDeviceDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import PageHeader from "@/components/page-header";
import { createDevice, deleteDevice, getApiErrorMessage, updateDevice } from "@/lib/api";
import { useEffect, useState } from "react";
import type { DeviceDto } from "@/types/dtos";
import { toast } from "sonner";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { deviceColumns } from "./components/device-columns";
import DevicesFilters from "./components/devices-filters";
import DevicesTable from "./components/devices-table";
import { useDevicesRows } from "./hooks/useDevicesRows";

const DevicesPage = () => {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deviceToEdit, setDeviceToEdit] = useState<DeviceDto | null>(null);
    const [deviceToDelete, setDeviceToDelete] = useState<DeviceDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { deviceRows, visibleDeviceRows, isLoading, loadDevices } = useDevicesRows({ searchText });

    const handleCreateDevice = async (values: Record<string, string | boolean>) => {
        await createDevice({
            name: String(values.name).trim(),
        });

        await loadDevices();
    };

    const handleOpenDeleteDialog = (device: DeviceDto) => {
        setDeviceToDelete(device);
        setIsDeleteDialogOpen(true);
    };

    const handleOpenEditDialog = (id: number) => {
        const device = deviceRows.find((item) => item.id === id);

        if (!device) {
            toast.error("Dispositivo non trovato");
            return;
        }

        setDeviceToEdit(device);
        setIsEditDialogOpen(true);
    };

    const handleEditDevice = async (values: Record<string, string | boolean>) => {
        if (!deviceToEdit) {
            return;
        }

        await updateDevice(deviceToEdit.id, {
            name: String(values.name).trim(),
        });

        await loadDevices();
    };

    const handleDeleteDevice = async () => {
        if (!deviceToDelete || isDeleting) {
            return;
        }

        try {
            setIsDeleting(true);
            await deleteDevice(deviceToDelete.id);
            toast.success("Dispositivo eliminato con successo");
            setIsDeleteDialogOpen(false);
            setDeviceToDelete(null);
            await loadDevices();
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile eliminare il dispositivo"));
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        void loadDevices();
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Dispositivi"
                description="Gestisci i dispositivi del laboratorio."
                action={<CreateEntityButton label="Crea nuovo dispositivo" onClick={() => setIsCreateDialogOpen(true)} />}
            />

            <CreateDeviceDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSubmit={handleCreateDevice}
            />

            <CreateDeviceDialog
                open={isEditDialogOpen}
                onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) {
                        setDeviceToEdit(null);
                    }
                }}
                mode="edit"
                initialValues={deviceToEdit}
                onSubmit={handleEditDevice}
            />

            <ConfirmDeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open);
                    if (!open) {
                        setDeviceToDelete(null);
                    }
                }}
                title="Elimina dispositivo"
                description={
                    deviceToDelete
                        ? `Sei sicuro di voler eliminare il dispositivo ${deviceToDelete.name}?`
                        : "Sei sicuro di voler eliminare questo dispositivo?"
                }
                isDeleting={isDeleting}
                onConfirm={handleDeleteDevice}
            />

            <DevicesFilters searchText={searchText} onSearchTextChange={setSearchText} />

            {isLoading && deviceRows.length === 0 ? (
                <TableLoadingSkeleton columns={deviceColumns.length} />
            ) : (
                <DevicesTable
                    columns={deviceColumns}
                    rows={visibleDeviceRows}
                    onEditDevice={handleOpenEditDialog}
                    onDeleteDevice={handleOpenDeleteDialog}
                />
            )}
        </div>
    );
}

export default DevicesPage;