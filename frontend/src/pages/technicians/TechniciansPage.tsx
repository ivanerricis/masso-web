import CreateEntityButton from "@/components/create-entity-button";
import CreateTechnicianDialog from "@/components/dialogs/create/createTechnicianDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import PageHeader from "@/components/page-header";
import SearchInput from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createTechnician, deleteTechnician, getApiErrorMessage, listTechnicians } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { TechnicianDto } from "@/types/dtos";
import { toast } from "sonner";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type TechnicianColumn = {
    key: keyof TechnicianDto | "actions";
    header: string;
    className?: string;
    render: (row: TechnicianDto) => ReactNode;
};

const technicianColumns: TechnicianColumn[] = [
    {
        key: "id",
        header: "ID",
        render: (row) => row.id,
    },
    {
        key: "firstName",
        header: "Nome",
        render: (row) => row.firstName,
    },
    {
        key: "lastName",
        header: "Cognome",
        render: (row) => row.lastName ?? "-",
    },
    {
        key: "phoneNumber",
        header: "Telefono",
        render: (row) => row.phoneNumber ?? "-",
    },
    {
        key: "vatNumber",
        header: "Partita IVA",
        render: (row) => row.vatNumber ?? "-",
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

const TechniciansPage = () => {
    const navigate = useNavigate();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [technicianRows, setTechnicianRows] = useState<TechnicianDto[]>([]);
    const [searchText, setSearchText] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [technicianToDelete, setTechnicianToDelete] = useState<TechnicianDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadTechnicians = async () => {
        try {
            const technicians = await listTechnicians();
            setTechnicianRows(technicians);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i tecnici"));
        }
    };

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

    const visibleTechnicianRows = technicianRows.filter((technician) => {
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

    useEffect(() => {
        const loadInitialTechnicians = async () => {
            try {
                const technicians = await listTechnicians();
                setTechnicianRows(technicians);
            } catch (error) {
                toast.error(getApiErrorMessage(error, "Impossibile caricare i tecnici"));
            }
        };

        void loadInitialTechnicians();
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

            <SearchInput value={searchText} onValueChange={setSearchText} placeholder="Cerca tecnico..." />

            <Table className="hidden sm:table bg-background">
                <TableHeader className="w-full">
                    <TableRow>
                        {technicianColumns.map((column) => (
                            <TableHead key={column.key} className={column.className}>
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {visibleTechnicianRows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={technicianColumns.length} className="py-6 text-center text-muted-foreground">
                                Nessun tecnico disponibile.
                            </TableCell>
                        </TableRow>
                    ) : (
                        visibleTechnicianRows.map((row) => (
                            <TableRow key={row.id}>
                                {technicianColumns.map((column) => (
                                    <TableCell key={`${row.id}-${column.key}`} className={column.className}>
                                        {column.key === "actions" ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="outline" size="lg" onClick={() => handleOpenTechnician(row.id)}>
                                                    Apri
                                                    <ChevronRight className="size-5" />
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="icon-lg"
                                                    className="bg-primary/10 hover:bg-primary/20"
                                                    onClick={() => toast.info("Modifica non ancora disponibile")}
                                                    aria-label={`Modifica tecnico ${row.id}`}
                                                >
                                                    <Pencil className="size-5 text-primary" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon-lg"
                                                    onClick={() => handleOpenDeleteDialog(row)}
                                                    aria-label={`Elimina tecnico ${row.id}`}
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

export default TechniciansPage;