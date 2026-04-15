import OpenEntityButton from "@/components/open-entity-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CustomerDto } from "@/types/dtos";
import { Pencil, Trash2 } from "lucide-react";
import type { CustomerColumn } from "./customer-columns";

type CustomersTableProps = {
    columns: CustomerColumn[];
    rows: CustomerDto[];
    onOpenCustomer: (id: number) => void;
    onEditCustomer: (id: number) => void;
    onDeleteCustomer: (customer: CustomerDto) => void;
};

const CustomersTable = ({
    columns,
    rows,
    onOpenCustomer,
    onEditCustomer,
    onDeleteCustomer,
}: CustomersTableProps) => {
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
                            Nessun cliente disponibile.
                        </TableCell>
                    </TableRow>
                ) : (
                    rows.map((row) => (
                        <TableRow key={row.id}>
                            {columns.map((column) => (
                                <TableCell key={`${row.id}-${column.key}`} className={column.className}>
                                    {column.key === "actions" ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <OpenEntityButton size="lg" onClick={() => onOpenCustomer(row.id)} aria-label={`Apri cliente ${row.id}`} />
                                            <Button
                                                variant="default"
                                                size="icon-lg"
                                                className="bg-primary/10 hover:bg-primary/20"
                                                onClick={() => onEditCustomer(row.id)}
                                                aria-label={`Modifica cliente ${row.id}`}
                                            >
                                                <Pencil className="size-5 text-primary" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon-lg"
                                                onClick={() => onDeleteCustomer(row)}
                                                aria-label={`Elimina cliente ${row.id}`}
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

export default CustomersTable;
