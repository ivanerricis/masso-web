import OpenEntityButton from "@/components/open-entity-button";
import TableActionButton from "@/components/table-action-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InterventionDto } from "@/types/dtos";
import { Pencil, Printer, Trash2 } from "lucide-react";
import type { InterventionColumn } from "./intervention-columns";

type InterventionsTableProps = {
    columns: InterventionColumn[];
    rows: InterventionDto[];
    onOpenIntervention: (id: number) => void;
    onEditIntervention: (id: number) => void;
    onPrintIntervention: (id: number) => void;
    onDeleteIntervention: (intervention: InterventionDto) => void;
};

const rowClassNameByStatus: Record<InterventionDto["status"], string> = {
    programmato: "bg-red-500/30 hover:bg-red-500/40 dark:bg-red-500/15 dark:hover:bg-red-500/20",
    in_lavorazione: "bg-yellow-400/30 hover:bg-yellow-400/40 dark:bg-yellow-400/15 dark:hover:bg-yellow-400/20",
    completato: "bg-green-500/30 hover:bg-green-500/40 dark:bg-green-500/15 dark:hover:bg-green-500/20",
};

const InterventionsTable = ({
    columns,
    rows,
    onOpenIntervention,
    onEditIntervention,
    onPrintIntervention,
    onDeleteIntervention,
}: InterventionsTableProps) => {
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
                            Nessun intervento disponibile.
                        </TableCell>
                    </TableRow>
                ) : (
                    rows.map((row) => (
                        <TableRow key={row.id} className={rowClassNameByStatus[row.status]}>
                            {columns.map((column) => (
                                <TableCell
                                    key={`${row.id}-${column.key}`}
                                    className={column.key === "actions" ? "bg-background" : column.className}
                                >
                                    {column.key === "actions" ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <OpenEntityButton
                                                size="icon-lg"
                                                onClick={() => onOpenIntervention(row.id)}
                                                aria-label={`Apri intervento ${row.id}`} />
                                            <TableActionButton
                                                variant="default"
                                                size="icon-lg"
                                                className="bg-primary/10 hover:bg-primary/20"
                                                onClick={() => onEditIntervention(row.id)}
                                                aria-label={`Modifica intervento ${row.id}`}
                                            >
                                                <Pencil className="size-5 text-primary" />
                                            </TableActionButton>
                                            <TableActionButton
                                                variant="default"
                                                size="icon-lg"
                                                className="bg-yellow-400/20 hover:bg-yellow-400/30"
                                                onClick={() => onPrintIntervention(row.id)}
                                                aria-label={`Stampa intervento ${row.id}`}
                                            >
                                                <Printer className="size-5 text-yellow-400" />
                                            </TableActionButton>
                                            <TableActionButton
                                                variant="destructive"
                                                size="icon-lg"
                                                onClick={() => onDeleteIntervention(row)}
                                                aria-label={`Elimina intervento ${row.id}`}
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

export default InterventionsTable;
