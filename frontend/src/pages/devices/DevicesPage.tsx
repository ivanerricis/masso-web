import CreateEntityButton from "@/components/create-entity-button";
import CreateDeviceDialog from "@/components/dialogs/createDeviceDialog";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import type { ReactNode } from "react";
import type { DeviceDto } from "@/types/dtos";

type DeviceColumn = {
    key: keyof DeviceDto | "actions";
    header: string;
    className?: string;
    render: (row: DeviceDto) => ReactNode;
};

const deviceRows: DeviceDto[] = [];

const deviceColumns: DeviceColumn[] = [
    {
        key: "name",
        header: "Nome",
        render: (row) => row.name,
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

const DevicesPage = () => {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Dispositivi"
                description="Gestisci i dispositivi del laboratorio."
                action={<CreateEntityButton label="Crea nuovo dispositivo" onClick={() => setIsCreateDialogOpen(true)} />}
            />
            <CreateDeviceDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
            <Table className="hidden sm:table bg-background">
                <TableHeader className="w-full">
                    <TableRow>
                        {deviceColumns.map((column) => (
                            <TableHead key={column.key} className={column.className}>
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {deviceRows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={deviceColumns.length} className="py-6 text-center text-muted-foreground">
                                Nessun dispositivo disponibile.
                            </TableCell>
                        </TableRow>
                    ) : (
                        deviceRows.map((row) => (
                            <TableRow key={row.id}>
                                {deviceColumns.map((column) => (
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

export default DevicesPage;