import EntityCardList from "@/components/entity-card-list";
import OpenEntityButton from "@/components/open-entity-button";
import TableActionButton from "@/components/table-action-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InterventionDto } from "@/types/dtos";
import { Mail, Pencil, Printer, Trash2 } from "lucide-react";
import type { InterventionColumn } from "./intervention-columns";

type InterventionsTableProps = {
    columns: InterventionColumn[];
    rows: InterventionDto[];
    onOpenIntervention: (id: number) => void;
    onEditIntervention: (id: number) => void;
    onPrintIntervention: (id: number) => void;
    onSendEmailIntervention: (id: number) => void;
    onDeleteIntervention: (intervention: InterventionDto) => void;
};

// Tinte piene con testo bianco: la cella azioni torna a bg-background/text-foreground
// per non colorare le icone dei pulsanti.
const rowClassNameByStatus: Record<InterventionDto["status"], string> = {
    programmato: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600",
    in_lavorazione: "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600",
    completato: "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600",
};

const accentClassNameByStatus: Record<InterventionDto["status"], string> = {
    programmato: "border-t-red-500",
    in_lavorazione: "border-t-yellow-400",
    completato: "border-t-green-500",
};

const InterventionsTable = ({
    columns,
    rows,
    onOpenIntervention,
    onEditIntervention,
    onPrintIntervention,
    onSendEmailIntervention,
    onDeleteIntervention,
}: InterventionsTableProps) => {
    const renderRowActions = (row: InterventionDto) => (
        <>
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
                variant="default"
                size="icon-lg"
                className="bg-sky-400/20 hover:bg-sky-400/30"
                onClick={() => onSendEmailIntervention(row.id)}
                aria-label={`Invia email intervento ${row.id}`}
            >
                <Mail className="size-5 text-sky-500" />
            </TableActionButton>
            <TableActionButton
                variant="destructive"
                size="icon-lg"
                onClick={() => onDeleteIntervention(row)}
                aria-label={`Elimina intervento ${row.id}`}
            >
                <Trash2 className="size-5" />
            </TableActionButton>
        </>
    );

    return (
        <>
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
                                    className={
                                        column.key === "actions"
                                            ? "bg-background text-foreground"
                                            : column.className
                                    }
                                >
                                    {column.key === "actions" ? (
                                        <div className="flex items-center justify-end gap-2">
                                            {renderRowActions(row)}
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

        <EntityCardList
            className="sm:hidden"
            columns={columns.filter((column) => column.key !== "actions")}
            rows={rows}
            getRowKey={(row) => row.id}
            getAccentClassName={(row) => accentClassNameByStatus[row.status]}
            renderActions={renderRowActions}
            emptyMessage="Nessun intervento disponibile."
        />
        </>
    );
};

export default InterventionsTable;
