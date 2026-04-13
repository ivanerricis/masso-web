import { Button } from "@/components/ui/button";
import CreateEntityButton from "@/components/create-entity-button";
import CreateReportDialog from "@/components/dialogs/createReportDialog";
import PageHeader from "@/components/page-header";
import SearchInput from "@/components/search-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import type { ReactNode } from "react";
import type { ReportDto } from "@/types/dtos";

type ReportColumn = {
    key: keyof ReportDto | "actions";
    header: string;
    className?: string;
    render: (row: ReportDto) => ReactNode;
};

const reportColumns: ReportColumn[] = [
    {
        key: "customer",
        header: "Cliente",
        render: (row) => row.customer,
    },
    {
        key: "device",
        header: "Dispositivo",
        render: (row) => row.device,
    },
    {
        key: "issue",
        header: "Difetto",
        render: (row) => row.issue,
    },
    {
        key: "technicians",
        header: "Tecnici",
        render: (row) => row.technicians,
    },
    {
        key: "totalPrice",
        header: "Prezzo",
        render: (row) => `${row.totalPrice} euro`,
    },
    {
        key: "closed",
        header: "Chiuso",
        render: (row) => (row.closed ? "Si" : "No"),
    },
    {
        key: "toInvoice",
        header: "Da fatturare",
        render: (row) => (row.toInvoice ? "Si" : "No"),
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

const reportRows: ReportDto[] = [];

const ReportsPage = () => {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Rapporti"
                description="Gestisci i rapporti del laboratorio."
                action={<CreateEntityButton label="Crea nuovo rapporto" onClick={() => setIsCreateDialogOpen(true)} />}
            />

            <CreateReportDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />

            <SearchInput />

            <Table className="hidden sm:table bg-background">
                <TableHeader className="w-full">
                    <TableRow>
                        {reportColumns.map((column) => (
                            <TableHead key={column.key} className={column.className}>
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reportRows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={reportColumns.length} className="py-6 text-center text-muted-foreground">
                                Nessun rapporto disponibile.
                            </TableCell>
                        </TableRow>
                    ) : (
                        reportRows.map((row) => (
                            <TableRow key={row.id}>
                                {reportColumns.map((column) => (
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

export default ReportsPage;