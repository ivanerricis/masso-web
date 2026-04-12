import CreateEntityButton from "@/components/create-entity-button";
import CreateCollaboratorDialog from "@/components/dialogs/createCollaboratorDialog";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import type { ReactNode } from "react";
import type { CollaboratorDto } from "@/types/dtos";

type CollaboratorColumn = {
    key: keyof CollaboratorDto | "actions";
    header: string;
    className?: string;
    render: (row: CollaboratorDto) => ReactNode;
};

const collaboratorRows: CollaboratorDto[] = [];

const collaboratorColumns: CollaboratorColumn[] = [
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
        render: (row) => row.createdAt,
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
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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
            />
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
                    {collaboratorRows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={collaboratorColumns.length} className="py-6 text-center text-muted-foreground">
                                Nessun collaboratore disponibile.
                            </TableCell>
                        </TableRow>
                    ) : (
                        collaboratorRows.map((row) => (
                            <TableRow key={row.id}>
                                {collaboratorColumns.map((column) => (
                                    <TableCell key={`${row.id}-${column.key}`} className={column.className}>
                                        {column.render(row)}
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