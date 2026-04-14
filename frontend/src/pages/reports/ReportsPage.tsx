import { Button } from "@/components/ui/button";
import CreateEntityButton from "@/components/create-entity-button";
import CreateReportDialog from "@/components/dialogs/create/createReportDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import PageHeader from "@/components/page-header";
import SearchInput from "@/components/search-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    createReport,
    deleteReport,
    getApiErrorMessage,
    listCustomers,
    listDevices,
    listIssues,
    listReports,
    listReportTechnicians,
    listTechnicians,
} from "@/lib/api";
import { formatDateTime, formatEuro } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { ReportDto } from "@/types/dtos";
import { toast } from "sonner";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import LoadingPage from "@/components/loadingPage";
import { useNavigate } from "react-router-dom";

type ReportVisibilityFilter = "all" | "open" | "closed";

type ReportColumn = {
    key: keyof ReportDto | "actions";
    header: string;
    className?: string;
    render: (row: ReportDto) => ReactNode;
};

const reportColumns: ReportColumn[] = [
    {
        key: "id",
        header: "ID",
        render: (row) => row.id,
    },
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
        key: "dataBackup",
        header: "Backup dati",
        render: (row) => (row.dataBackup ? "Si" : "No"),
    },
    {
        key: "charger",
        header: "Alimentatore",
        render: (row) => (row.charger ? "Si" : "No"),
    },
    {
        key: "technician",
        header: "Tecnico",
        render: (row) => row.technician,
    },
    {
        key: "internalPrice",
        header: "Prezzo interno",
        render: (row) => formatEuro(row.internalPrice),
    },
    {
        key: "technicianPrice",
        header: "Prezzo tecnico",
        render: (row) => formatEuro(row.technicianPrice),
    },
    {
        key: "totalPrice",
        header: "Prezzo totale",
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
        render: () => null,
    },
];

const formatCustomerOption = (firstName: string, lastName: string | null, phoneNumber: string | null) => {
    const fullName = `${firstName} ${lastName ?? ""}`.trim();
    return `${fullName} - ${phoneNumber?.trim() || "N/D"}`;
};

const ReportsPage = () => {
    const navigate = useNavigate();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [reportRows, setReportRows] = useState<ReportDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<ReportDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [visibilityFilter, setVisibilityFilter] = useState<ReportVisibilityFilter>("open");
    const [searchText, setSearchText] = useState("");

    const visibleReportRows = reportRows.filter((report) => {
        const query = searchText.trim().toLowerCase();
        const matchesSearch = !query
            ? true
            : [
                    String(report.id),
                    report.customer,
                    report.device,
                    report.issue,
                    report.technician,
                    report.internalPrice,
                    report.technicianPrice,
                    report.totalPrice,
                    report.closed ? "chiuso" : "aperto",
                    report.toInvoice ? "da fatturare" : "non fatturare",
                    report.dataBackup ? "backup dati" : "",
                    report.charger ? "alimentatore" : "",
              ]
                    .join(" ")
                    .toLowerCase()
                    .includes(query);

        if (!matchesSearch) {
            return false;
        }

        if (visibilityFilter === "open") {
            return !report.closed;
        }

        if (visibilityFilter === "closed") {
            return report.closed;
        }

        return true;
    });

    const loadReports = async () => {
        setIsLoading(true)
        try {
            const [reports, customers, devices, issues, reportTechnicians, technicians] = await Promise.all([
                listReports(),
                listCustomers(),
                listDevices(),
                listIssues(),
                listReportTechnicians(),
                listTechnicians(),
            ]);

            const customerById = new Map(customers.map((customer) => [customer.id, customer]));
            const deviceById = new Map(devices.map((device) => [device.id, device]));
            const issueById = new Map(issues.map((issue) => [issue.id, issue]));
            const technicianById = new Map(
                technicians.map((technician) => [
                    technician.id,
                    `${technician.firstName} ${technician.lastName ?? ""}`.trim(),
                ])
            );

            const technicianByReportId = new Map<number, string>();
            const techniciansPriceByReportId = new Map<number, number>();

            for (const item of reportTechnicians) {
                technicianByReportId.set(item.reportId, technicianById.get(item.technicianId) ?? "-");
                techniciansPriceByReportId.set(item.reportId, (techniciansPriceByReportId.get(item.reportId) ?? 0) + item.price);
            }

            const mappedRows: ReportDto[] = reports.map((report) => {
                const customer = customerById.get(report.customerId);
                const device = deviceById.get(report.deviceId);
                const issue = issueById.get(report.issueId);
                const technician = technicianByReportId.get(report.id) ?? "-";
                const techniciansPrice = techniciansPriceByReportId.get(report.id) ?? 0;

                return {
                    id: report.id,
                    customer: customer ? `${customer.firstName} ${customer.lastName ?? ""}`.trim() : "-",
                    device: device?.name ?? "-",
                    issue: issue?.description ?? "-",
                    password: report.password,
                    charger: report.charger,
                    dataBackup: report.dataBackup,
                    technician,
                    internalPrice: report.price,
                    technicianPrice: techniciansPrice,
                    totalPrice: report.price + techniciansPrice,
                    closed: report.closed,
                    toInvoice: report.toInvoice,
                    createdAt: report.created_at,
                };
            });

            setReportRows(mappedRows);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i rapporti"));
        } finally {
            setIsLoading(false)
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
                    password: String(values.password).trim() === "" ? null : String(values.password).trim(),
                issueDescription:
                    String(values.issueDescription).trim() === "" ? null : String(values.issueDescription).trim(),
                dataBackup: Boolean(values.dataBackup),
                    charger: Boolean(values.charger),
            });

            await loadReports();
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile creare il rapporto"));
            throw error;
        }
    };

    const handleOpenDeleteDialog = (report: ReportDto) => {
        setReportToDelete(report);
        setIsDeleteDialogOpen(true);
    };

    const handleOpenReport = (id: number) => {
        navigate(`/reports/${id}`);
    };

    const handleDeleteReport = async () => {
        if (!reportToDelete || isDeleting) {
            return;
        }

        try {
            setIsDeleting(true);
            await deleteReport(reportToDelete.id);
            toast.success("Rapporto eliminato con successo");
            setIsDeleteDialogOpen(false);
            setReportToDelete(null);
            await loadReports();
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile eliminare il rapporto"));
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        void loadReports();
    }, []);

    return (
        <div className="flex flex-col gap-4 w-full h-full">
            {isLoading ? (
                <LoadingPage />
            ) : (
                <>
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

                    <ConfirmDeleteDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open);
                            if (!open) {
                                setReportToDelete(null);
                            }
                        }}
                        title="Elimina rapporto"
                        description={
                            reportToDelete
                                ? `Sei sicuro di voler eliminare il rapporto ID ${reportToDelete.id}?`
                                : "Sei sicuro di voler eliminare questo rapporto?"
                        }
                        isDeleting={isDeleting}
                        onConfirm={handleDeleteReport}
                    />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <SearchInput value={searchText} onValueChange={setSearchText} placeholder="Cerca rapporto..." />
                        <Select value={visibilityFilter} onValueChange={(value) => setVisibilityFilter(value as ReportVisibilityFilter)}>
                            <SelectTrigger className="w-full sm:w-56">
                                <SelectValue placeholder="Filtra per stato" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                                <SelectItem value="all">Tutti i rapportini</SelectItem>
                                <SelectItem value="open">Rapportini aperti</SelectItem>
                                <SelectItem value="closed">Rapportini chiusi</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

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
                            {visibleReportRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={reportColumns.length} className="py-6 text-center text-muted-foreground">
                                        Nessun rapporto disponibile.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                visibleReportRows.map((row) => (
                                    <TableRow key={row.id}>
                                        {reportColumns.map((column) => (
                                            <TableCell key={`${row.id}-${column.key}`} className={column.className}>
                                                {column.key === "actions" ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="outline" size="lg" onClick={() => handleOpenReport(row.id)}>
                                                            Apri
                                                            <ChevronRight className="size-5" />
                                                        </Button>
                                                        <Button
                                                            variant="default"
                                                            size="icon-lg"
                                                            className="bg-primary/10 hover:bg-primary/20"
                                                            onClick={() => toast.info("Modifica non ancora disponibile")}
                                                            aria-label={`Modifica rapporto ${row.id}`}
                                                        >
                                                            <Pencil className="size-5 text-primary" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon-lg"
                                                            onClick={() => handleOpenDeleteDialog(row)}
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
                </>
            )}
        </div>
    );
}

export default ReportsPage;