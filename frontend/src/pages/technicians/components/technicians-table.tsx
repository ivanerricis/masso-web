import OpenEntityButton from "@/components/open-entity-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TechnicianDto } from "@/types/dtos";
import { Pencil, Trash2 } from "lucide-react";
import type { TechnicianColumn } from "./technician-columns";

type TechniciansTableProps = {
    columns: TechnicianColumn[];
    rows: TechnicianDto[];
    onOpenTechnician: (id: number) => void;
    onEditTechnician: (id: number) => void;
    onDeleteTechnician: (technician: TechnicianDto) => void;
};

const TechniciansTable = ({
    columns,
    rows,
    onOpenTechnician,
    onEditTechnician,
    onDeleteTechnician,
}: TechniciansTableProps) => {
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
                            Nessun tecnico disponibile.
                        </TableCell>
                    </TableRow>
                ) : (
                    rows.map((row) => (
                        <TableRow key={row.id}>
                            {columns.map((column) => (
                                <TableCell key={`${row.id}-${column.key}`} className={column.className}>
                                    {column.key === "actions" ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <OpenEntityButton size="lg" onClick={() => onOpenTechnician(row.id)} aria-label={`Apri tecnico ${row.id}`} />
                                            <Button
                                                variant="default"
                                                size="icon-lg"
                                                className="bg-primary/10 hover:bg-primary/20"
                                                onClick={() => onEditTechnician(row.id)}
                                                aria-label={`Modifica tecnico ${row.id}`}
                                            >
                                                <Pencil className="size-5 text-primary" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon-lg"
                                                onClick={() => onDeleteTechnician(row)}
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
    );
};

export default TechniciansTable;
