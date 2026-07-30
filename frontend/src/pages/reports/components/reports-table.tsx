import EntityCardList from "@/components/entity-card-list";
import OpenEntityButton from "@/components/open-entity-button";
import TableActionButton from "@/components/table-action-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReportDto } from "@/types/dtos";
import { Pencil, Printer, Trash2 } from "lucide-react";
import type { ReportColumn } from "./report-columns";

type ReportsTableProps = {
    columns: ReportColumn[];
    rows: ReportDto[];
    onOpenReport: (id: number) => void;
    onEditReport: (id: number) => void;
    onPrintReport: (id: number) => void;
    onDeleteReport: (report: ReportDto) => void;
};

const getAccentClassName = (row: ReportDto) => (row.closed ? "border-t-green-500" : "border-t-red-500");

// Sfondo e testo li decide index.css in base a data-status-color e all'intensità scelta
// in Impostazioni > Tema; la cella azioni torna a bg-background/text-foreground per non
// colorare le icone dei pulsanti.
const getStatusColor = (row: ReportDto) => (row.closed ? "green" : "red");

const ReportsTable = ({
    columns,
    rows,
    onOpenReport,
    onEditReport,
    onPrintReport,
    onDeleteReport,
}: ReportsTableProps) => {
    const renderRowActions = (row: ReportDto) => (
        <>
            <OpenEntityButton
                size="icon-lg"
                onClick={() => onOpenReport(row.id)}
                aria-label={`Apri rapporto ${row.id}`} />
            <TableActionButton
                variant="default"
                size="icon-lg"
                className="bg-primary/10 hover:bg-primary/20"
                onClick={() => onEditReport(row.id)}
                aria-label={`Modifica rapporto ${row.id}`}
            >
                <Pencil className="size-5 text-primary" />
            </TableActionButton>
            <TableActionButton
                variant="default"
                size="icon-lg"
                className="bg-yellow-400/20 hover:bg-yellow-400/30"
                onClick={() => onPrintReport(row.id)}
                aria-label={`Stampa rapporto ${row.id}`}
            >
                <Printer className="size-5 text-yellow-400" />
            </TableActionButton>
            <TableActionButton
                variant="destructive"
                size="icon-lg"
                onClick={() => onDeleteReport(row)}
                aria-label={`Elimina rapporto ${row.id}`}
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
                            Nessun rapporto disponibile.
                        </TableCell>
                    </TableRow>
                ) : (
                    rows.map((row) => (
                        <TableRow key={row.id} data-status-color={getStatusColor(row)}>
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
            getAccentClassName={getAccentClassName}
            renderActions={renderRowActions}
            emptyMessage="Nessun rapporto disponibile."
        />
        </>
    );
};

export default ReportsTable;
