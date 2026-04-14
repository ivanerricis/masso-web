import CreateEntityButton from "@/components/create-entity-button";
import CreateDeviceDialog from "@/components/dialogs/create/createDeviceDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import PageHeader from "@/components/page-header";
import SearchInput from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createDevice, deleteDevice, getApiErrorMessage, listDevices } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { DeviceDto } from "@/types/dtos";
import { toast } from "sonner";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type DeviceColumn = {
    key: keyof DeviceDto | "actions";
    header: string;
    className?: string;
    render: (row: DeviceDto) => ReactNode;
};

const deviceColumns: DeviceColumn[] = [
    {
        key: "id",
        header: "ID",
        render: (row) => row.id,
    },
    {
        key: "name",
        header: "Nome",
        render: (row) => row.name,
    },
    {
        key: "createdAt",
        header: "Creato il",
        render: (row) => formatDateTime(row.createdAt),
    },
    {
        key: "actions",
        header: "Azioni",
        className: "text-right",
        render: () => (
            <Button variant="outline" size="sm">
                Apri
            </Button>
        ),
    },
];

const DevicesPage = () => {
    const navigate = useNavigate();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [deviceRows, setDeviceRows] = useState<DeviceDto[]>([]);
    const [searchText, setSearchText] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState<DeviceDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadDevices = async () => {
        try {
            const devices = await listDevices();
            setDeviceRows(devices);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i dispositivi"));
        }
    };

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

    const handleOpenDevice = (id: number) => {
        navigate(`/devices/${id}`);
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

    const visibleDeviceRows = deviceRows.filter((device) => {
        const query = searchText.trim().toLowerCase();
        if (!query) {
            return true;
        }

        return [String(device.id), device.name]
            .join(" ")
            .toLowerCase()
            .includes(query);
    });

    useEffect(() => {
        const loadInitialDevices = async () => {
            try {
                const devices = await listDevices();
                setDeviceRows(devices);
            } catch (error) {
                toast.error(getApiErrorMessage(error, "Impossibile caricare i dispositivi"));
            }
        };

        void loadInitialDevices();
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

            <SearchInput value={searchText} onValueChange={setSearchText} placeholder="Cerca dispositivo..." />

            <Table className="hidden sm:table bg-background">
                <TableHeader className="w-full">
                    <TableRow>
                        {deviceColumns.map((column) => (
                            <TableHead key={column.key} className={column.className}>
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {visibleDeviceRows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={deviceColumns.length} className="py-6 text-center text-muted-foreground">
                                Nessun dispositivo disponibile.
                            </TableCell>
                        </TableRow>
                    ) : (
                        visibleDeviceRows.map((row) => (
                            <TableRow key={row.id}>
                                {deviceColumns.map((column) => (
                                    <TableCell key={`${row.id}-${column.key}`} className={column.className}>
                                        {column.key === "actions" ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="outline" size="lg" onClick={() => handleOpenDevice(row.id)}>
                                                    Apri
                                                    <ChevronRight className="size-5" />
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="icon-lg"
                                                    className="bg-primary/10 hover:bg-primary/20"
                                                    onClick={() => toast.info("Modifica non ancora disponibile")}
                                                    aria-label={`Modifica dispositivo ${row.id}`}
                                                >
                                                    <Pencil className="size-5 text-primary" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon-lg"
                                                    onClick={() => handleOpenDeleteDialog(row)}
                                                    aria-label={`Elimina dispositivo ${row.id}`}
                                                >
                                                    <Trash2 className="size-5" />
                                                </Button>
                                            </div>
                                        ) : (
                                            column.render(row)
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export default DevicesPage;