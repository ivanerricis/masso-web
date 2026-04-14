import CreateEntityButton from "@/components/create-entity-button";
import CreateCollaboratorDialog from "@/components/dialogs/create/createCollaboratorDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import PageHeader from "@/components/page-header";
import SearchInput from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createCollaborator, deleteCollaborator, getApiErrorMessage, listCollaborators } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { CollaboratorDto } from "@/types/dtos";
import { toast } from "sonner";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type CollaboratorColumn = {
    key: keyof CollaboratorDto | "actions";
    header: string;
    className?: string;
    render: (row: CollaboratorDto) => ReactNode;
};

const collaboratorColumns: CollaboratorColumn[] = [
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

const CollaboratorsPage = () => {
    const navigate = useNavigate();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [collaboratorRows, setCollaboratorRows] = useState<CollaboratorDto[]>([]);
    const [searchText, setSearchText] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [collaboratorToDelete, setCollaboratorToDelete] = useState<CollaboratorDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadCollaborators = async () => {
        try {
            const collaborators = await listCollaborators();
            setCollaboratorRows(collaborators);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i collaboratori"));
        }
    };

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

    const visibleCollaboratorRows = collaboratorRows.filter((collaborator) => {
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

    useEffect(() => {
        const loadInitialCollaborators = async () => {
            try {
                const collaborators = await listCollaborators();
                setCollaboratorRows(collaborators);
            } catch (error) {
                toast.error(getApiErrorMessage(error, "Impossibile caricare i collaboratori"));
            }
        };

        void loadInitialCollaborators();
    }, []);

    return (
        <div className="flex flex-col gap-4">
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

            <SearchInput value={searchText} onValueChange={setSearchText} placeholder="Cerca collaboratore..." />

            <Table className="hidden sm:table bg-background">
                <TableHeader className="w-full">
                    <TableRow>
                        {collaboratorColumns.map((column) => (
                            <TableHead key={column.key} className={column.className}>
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {visibleCollaboratorRows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={collaboratorColumns.length} className="py-6 text-center text-muted-foreground">
                                Nessun collaboratore disponibile.
                            </TableCell>
                        </TableRow>
                    ) : (
                        visibleCollaboratorRows.map((row) => (
                            <TableRow key={row.id}>
                                {collaboratorColumns.map((column) => (
                                    <TableCell key={`${row.id}-${column.key}`} className={column.className}>
                                        {column.key === "actions" ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="outline" size="lg" onClick={() => handleOpenCollaborator(row.id)}>
                                                    Apri
                                                    <ChevronRight className="size-5" />
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="icon-lg"
                                                    className="bg-primary/10 hover:bg-primary/20"
                                                    onClick={() => toast.info("Modifica non ancora disponibile")}
                                                    aria-label={`Modifica collaboratore ${row.id}`}
                                                >
                                                    <Pencil className="size-5 text-primary" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon-lg"
                                                    onClick={() => handleOpenDeleteDialog(row)}
                                                    aria-label={`Elimina collaboratore ${row.id}`}
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

export default CollaboratorsPage;