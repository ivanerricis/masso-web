import OpenEntityButton from "@/components/open-entity-button";
import { Button } from "@/components/ui/button";
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

const ReportsTable = ({
    columns,
    rows,
    onOpenReport,
    onEditReport,
    onPrintReport,
    onDeleteReport,
}: ReportsTableProps) => {
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
                            Nessun rapporto disponibile.
                        </TableCell>
                    </TableRow>
                ) : (
                    rows.map((row) => (
                        <TableRow
                            key={row.id}
                            className={
                                row.closed
                                    ? "bg-green-500/30 hover:bg-green-500/40 dark:bg-green-500/15 dark:hover:bg-green-500/20"
                                    : "bg-red-500/30 hover:bg-red-500/40 dark:bg-red-500/15 dark:hover:bg-red-500/20"
                            }
                        >
                            {columns.map((column) => (
                                <TableCell
                                    key={`${row.id}-${column.key}`}
                                    className={column.key === "actions" ? "bg-background" : column.className}
                                >
                                    {column.key === "actions" ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <OpenEntityButton
                                                size="icon-lg"
                                                onClick={() => onOpenReport(row.id)}
                                                aria-label={`Apri rapporto ${row.id}`} />
                                            <Button
                                                variant="default"
                                                size="icon-lg"
                                                className="bg-primary/10 hover:bg-primary/20"
                                                onClick={() => onEditReport(row.id)}
                                                aria-label={`Modifica rapporto ${row.id}`}
                                            >
                                                <Pencil className="size-5 text-primary" />
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="icon-lg"
                                                className="bg-yellow-400/20 hover:bg-yellow-400/30"
                                                onClick={() => onPrintReport(row.id)}
                                                aria-label={`Stampa rapporto ${row.id}`}
                                            >
                                                <Printer className="size-5 text-yellow-400" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon-lg"
                                                onClick={() => onDeleteReport(row)}
                                                aria-label={`Elimina rapporto ${row.id}`}
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
    );
};

export default ReportsTable;
