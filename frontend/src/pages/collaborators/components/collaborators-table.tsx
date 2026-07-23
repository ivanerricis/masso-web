import OpenEntityButton from "@/components/open-entity-button";
import TableActionButton from "@/components/table-action-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CollaboratorDto } from "@/types/dtos";
import { Pencil, Trash2 } from "lucide-react";
import type { CollaboratorColumn } from "./collaborator-columns";

type CollaboratorsTableProps = {
    columns: CollaboratorColumn[];
    rows: CollaboratorDto[];
    onOpenCollaborator: (id: number) => void;
    onEditCollaborator: (id: number) => void;
    onDeleteCollaborator: (collaborator: CollaboratorDto) => void;
};

const CollaboratorsTable = ({
    columns,
    rows,
    onOpenCollaborator,
    onEditCollaborator,
    onDeleteCollaborator,
}: CollaboratorsTableProps) => {
    return (
        <Table className="hidden sm:table bg-background">
            <TableHeader className="w-full">
                <TableRow>
                    {columns.map((column) => (
                        <TableHead key={column.key} className={column.className}>
                            {column.header}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={columns.length} className="py-6 text-center text-muted-foreground">
                            Nessun collaboratore disponibile.
                        </TableCell>
                    </TableRow>
                ) : (
                    rows.map((row) => (
                        <TableRow key={row.id}>
                            {columns.map((column) => (
                                <TableCell key={`${row.id}-${column.key}`} className={column.className}>
                                    {column.key === "actions" ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <OpenEntityButton size="lg" onClick={() => onOpenCollaborator(row.id)} aria-label={`Apri collaboratore ${row.id}`} />
                                            <TableActionButton
                                                variant="default"
                                                size="icon-lg"
                                                className="bg-primary/10 hover:bg-primary/20"
                                                onClick={() => onEditCollaborator(row.id)}
                                                aria-label={`Modifica collaboratore ${row.id}`}
                                            >
                                                <Pencil className="size-5 text-primary" />
                                            </TableActionButton>
                                            <TableActionButton
                                                variant="destructive"
                                                size="icon-lg"
                                                onClick={() => onDeleteCollaborator(row)}
                                                aria-label={`Elimina collaboratore ${row.id}`}
                                            >
                                                <Trash2 className="size-5" />
                                            </TableActionButton>
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
    );
};

export default CollaboratorsTable;
