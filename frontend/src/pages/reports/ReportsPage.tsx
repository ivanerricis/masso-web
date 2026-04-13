import { Button } from "@/components/ui/button";
import CreateEntityButton from "@/components/create-entity-button";
import CreateReportDialog from "@/components/dialogs/createReportDialog";
import PageHeader from "@/components/page-header";
import SearchInput from "@/components/search-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    createReport,
    getApiErrorMessage,
    listCustomers,
    listDevices,
    listIssues,
    listReports,
    listReportTechnicians,
} from "@/lib/api";
import { formatDateTime, formatEuro } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { ReportDto } from "@/types/dtos";
import { toast } from "sonner";

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
        render: (row) => formatEuro(row.totalPrice),
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
        render: (row) => formatDateTime(row.createdAt),
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

const formatCustomerOption = (firstName: string, lastName: string | null, phoneNumber: string | null) => {
    const fullName = `${firstName} ${lastName ?? ""}`.trim();
    return `${fullName} - ${phoneNumber?.trim() || "N/D"}`;
};

const ReportsPage = () => {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [reportRows, setReportRows] = useState<ReportDto[]>([]);

    const loadReports = async () => {
        try {
            const [reports, customers, devices, issues, reportTechnicians] = await Promise.all([
                listReports(),
                listCustomers(),
                listDevices(),
                listIssues(),
                listReportTechnicians(),
            ]);

            const customerById = new Map(customers.map((customer) => [customer.id, customer]));
            const deviceById = new Map(devices.map((device) => [device.id, device]));
            const issueById = new Map(issues.map((issue) => [issue.id, issue]));

            const techniciansByReportId = new Map<number, number>();
            const techniciansPriceByReportId = new Map<number, number>();

            for (const item of reportTechnicians) {
                techniciansByReportId.set(item.reportId, (techniciansByReportId.get(item.reportId) ?? 0) + 1);
                techniciansPriceByReportId.set(item.reportId, (techniciansPriceByReportId.get(item.reportId) ?? 0) + item.price);
            }

            const mappedRows: ReportDto[] = reports.map((report) => {
                const customer = customerById.get(report.customerId);
                const device = deviceById.get(report.deviceId);
                const issue = issueById.get(report.issueId);
                const techniciansCount = techniciansByReportId.get(report.id) ?? 0;
                const techniciansPrice = techniciansPriceByReportId.get(report.id) ?? 0;

                return {
                    id: report.id,
                    customer: customer ? `${customer.firstName} ${customer.lastName ?? ""}`.trim() : "-",
                    device: device?.name ?? "-",
                    issue: issue?.description ?? "-",
                    technicians: techniciansCount,
                    totalPrice: report.price + techniciansPrice,
                    closed: report.closed,
                    toInvoice: report.toInvoice,
                    createdAt: report.created_at,
                };
            });

            setReportRows(mappedRows);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i rapporti"));
        }
    };

    const handleCreateReport = async (values: Record<string, string | boolean>) => {
        try {
            const [customers, devices, issues] = await Promise.all([
                listCustomers(),
                listDevices(),
                listIssues(),
            ]);

            const selectedCustomer = customers.find(
                (customer) =>
                    formatCustomerOption(customer.firstName, customer.lastName, customer.phoneNumber) ===
                    String(values.customer)
            );

            const selectedDevice = devices.find(
                (device) => device.name.toLowerCase() === String(values.deviceType).trim().toLowerCase()
            );

            const selectedIssue = issues.find(
                (issue) => issue.description.toLowerCase() === String(values.issueDescription).trim().toLowerCase()
            );

            if (!selectedCustomer) {
                throw new Error("Seleziona un cliente esistente o creane uno nuovo.");
            }

            if (!selectedDevice) {
                throw new Error("Seleziona una tipologia dispositivo esistente o creane una nuova.");
            }

            if (!selectedIssue) {
                throw new Error("Seleziona un difetto esistente o creane uno nuovo.");
            }

            await createReport({
                deviceId: selectedDevice.id,
                issueId: selectedIssue.id,
                customerId: selectedCustomer.id,
                note: String(values.notes).trim() === "" ? null : String(values.notes).trim(),
                issueDescription:
                    String(values.issueDescription).trim() === "" ? null : String(values.issueDescription).trim(),
                dataBackup: Boolean(values.dataBackup),
            });

            await loadReports();
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile creare il rapporto"));
            throw error;
        }
    };

    useEffect(() => {
        void loadReports();
    }, []);

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
                onSubmit={handleCreateReport}
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