import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DeviceDto } from "@/types/dtos";
import { Pencil, Trash2 } from "lucide-react";
import type { DeviceColumn } from "./device-columns";

type DevicesTableProps = {
    columns: DeviceColumn[];
    rows: DeviceDto[];
    onEditDevice: (id: number) => void;
    onDeleteDevice: (device: DeviceDto) => void;
};

const DevicesTable = ({ columns, rows, onEditDevice, onDeleteDevice }: DevicesTableProps) => {
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
                            Nessun dispositivo disponibile.
                        </TableCell>
                    </TableRow>
                ) : (
                    rows.map((row) => (
                        <TableRow key={row.id}>
                            {columns.map((column) => (
                                <TableCell key={`${row.id}-${column.key}`} className={column.className}>
                                    {column.key === "actions" ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="default"
                                                size="icon-lg"
                                                className="bg-primary/10 hover:bg-primary/20"
                                                onClick={() => onEditDevice(row.id)}
                                                aria-label={`Modifica dispositivo ${row.id}`}
                                            >
                                                <Pencil className="size-5 text-primary" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon-lg"
                                                onClick={() => onDeleteDevice(row)}
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
    );
};

export default DevicesTable;
