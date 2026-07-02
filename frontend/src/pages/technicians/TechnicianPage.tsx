import LoadingPage from "@/components/loadingPage";
import { Button } from "@/components/ui/button";
import EditReportDialog, { type EditReportSubmitValues } from "@/components/dialogs/edit/editReportDialog";
import TablePagination from "@/components/table-pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    createReportTechnician,
    getApiErrorMessage,
    listCustomers,
    listDevices,
    listReportTechnicians,
    listReports,
    listTechnicians,
    deleteReportTechnician,
    updateReport,
    updateReportTechnician,
} from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import type { ReportVisibilityFilter } from "../reports/components/types";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import OpenEntityButton from "@/components/open-entity-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTablePagination } from "@/hooks/useTablePagination";

type TechnicianReportCard = {
    id: number;
    customerName: string;
    deviceName: string;
    closed: boolean;
};

const TechnicianPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const technicianId = Number(id);
    const [isLoading, setIsLoading] = useState(true);
    const [technicianName, setTechnicianName] = useState("Tecnico");
    const [reportCards, setReportCards] = useState<TechnicianReportCard[]>([]);
    const [visibilityFilter, setVisibilityFilter] = useState<ReportVisibilityFilter>("open");
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [reportIdToEdit, setReportIdToEdit] = useState<number | null>(null);
    const [reportCustomerNameToEdit, setReportCustomerNameToEdit] = useState("");

    const hasValidTechnicianId = useMemo(
        () => Number.isInteger(technicianId) && technicianId > 0,
        [technicianId]
    );

    const handleBack = () => {
        navigate(-1);
    };

    const handleOpenReport = (reportId: number) => {
        navigate(`/reports/${reportId}`);
    };

    const handleOpenEditDialog = (reportId: number) => {
        const report = reportCards.find((item) => item.id === reportId);
        setReportIdToEdit(reportId);
        setReportCustomerNameToEdit(report?.customerName ?? "");
        setIsEditDialogOpen(true);
    };

    const handleEditReport = async (values: EditReportSubmitValues) => {
        await updateReport(values.reportId, {
            customerId: values.customerId,
            deviceId: values.deviceId,
            issueId: values.issueId,
            collaboratorId: values.collaboratorId,
            serviceDescription: values.serviceDescription,
            note: values.note,
            password: values.password,
            dataBackup: values.dataBackup,
            charger: values.charger,
            closed: values.closed,
            paymentMethod: values.paymentMethod,
            price: values.internalPrice,
        });

        if (values.technicianId != null) {
            if (values.existingTechnicianId == null) {
                await createReportTechnician({
                    reportId: values.reportId,
                    technicianId: values.technicianId,
                    price: values.technicianPrice,
                });
            } else if (values.existingTechnicianId === values.technicianId) {
                await updateReportTechnician(values.reportId, values.technicianId, values.technicianPrice);
            } else {
                await deleteReportTechnician(values.reportId, values.existingTechnicianId);
                await createReportTechnician({
                    reportId: values.reportId,
                    technicianId: values.technicianId,
                    price: values.technicianPrice,
                });
            }
        } else if (values.existingTechnicianId != null) {
            await deleteReportTechnician(values.reportId, values.existingTechnicianId);
        }

        await loadData();
    };

    const visibleReportCards = useMemo(() => {
        if (visibilityFilter === "open") {
            return reportCards.filter((report) => !report.closed);
        }

        if (visibilityFilter === "closed") {
            return reportCards.filter((report) => report.closed);
        }

        return reportCards;
    }, [reportCards, visibilityFilter]);
    const pageSize = 10;
    const { currentPage, setCurrentPage } = useTablePagination({
        resetDependencies: [visibilityFilter],
    });
    const totalItems = visibleReportCards.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const paginatedReportCards = visibleReportCards.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [reports, reportTechnicians, technicians, customers, devices] = await Promise.all([
                listReports(),
                listReportTechnicians(),
                listTechnicians(),
                listCustomers(),
                listDevices(),
            ]);

            const technician = technicians.find((item) => item.id === technicianId);
            if (technician) {
                setTechnicianName(`${technician.firstName} ${technician.lastName ?? ""}`.trim());
            }

            const reportIdsForTechnician = new Set(
                reportTechnicians
                    .filter((item) => item.technicianId === technicianId)
                    .map((item) => item.reportId)
            );

            const customerById = new Map(customers.map((customer) => [customer.id, customer]));
            const deviceById = new Map(devices.map((device) => [device.id, device]));

            const cards = reports
                .filter((report) => reportIdsForTechnician.has(report.id))
                .map((report) => {
                    const customer = customerById.get(report.customerId);
                    const device = deviceById.get(report.deviceId);

                    return {
                        id: report.id,
                        customerName:
                            customer ? `${customer.firstName} ${customer.lastName ?? ""}`.trim() : "Cliente sconosciuto",
                        deviceName: device?.name ?? "Dispositivo sconosciuto",
                        closed: report.closed,
                    };
                });

            setReportCards(cards);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i report del tecnico"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!hasValidTechnicianId) {
            toast.error("Tecnico non valido");
            navigate("/technicians");
            return;
        }
        void loadData();
    }, [hasValidTechnicianId, navigate, technicianId]);

    if (isLoading) {
        return <LoadingPage />;
    }

    return (
        <div className="flex flex-col w-full h-full gap-4">
            <div className="flex items-center gap-2">
                <Button size="icon-lg" variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="size-6" />
                </Button>
                <h1 className="text-2xl font-bold">{technicianName}</h1>
            </div>

            <p className="ml-12">Rapporti del tecnico</p>
            <div className="ml-12">
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
            <div className="ml-12">
                {visibleReportCards.length === 0 ? (
                    <p className="text-muted-foreground">Nessun report associato a questo tecnico.</p>
                ) : (
                    <div className="flex flex-col gap-4">
                        <Table className="hidden sm:table bg-background">
                            <TableHeader className="w-full">
                                <TableRow>
                                    <TableHead>Report</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Dispositivo</TableHead>
                                    <TableHead>Stato</TableHead>
                                    <TableHead className="text-right">Azioni</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedReportCards.map((report) => (
                                    <TableRow
                                        key={report.id}
                                        className={
                                            report.closed
                                                ? "bg-green-500/30 hover:bg-green-500/40 dark:bg-green-500/15 dark:hover:bg-green-500/20"
                                                : "bg-red-500/30 hover:bg-red-500/40 dark:bg-red-500/15 dark:hover:bg-red-500/20"
                                        }
                                    >
                                        <TableCell>#{report.id}</TableCell>
                                        <TableCell>{report.customerName}</TableCell>
                                        <TableCell>{report.deviceName}</TableCell>
                                        <TableCell>{report.closed ? "Chiuso" : "Aperto"}</TableCell>
                                        <TableCell className="bg-background">
                                            <div className="flex items-center justify-end gap-2">
                                                <OpenEntityButton
                                                    size="icon-lg"
                                                    onClick={() => handleOpenReport(report.id)}
                                                    aria-label={`Apri report ${report.id}`}
                                                />
                                                <Button
                                                    variant="default"
                                                    size="icon-lg"
                                                    className="bg-primary/10 hover:bg-primary/20"
                                                    onClick={() => handleOpenEditDialog(report.id)}
                                                    aria-label={`Modifica report ${report.id}`}
                                                >
                                                    <Pencil className="size-5 text-primary" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            <EditReportDialog
                open={isEditDialogOpen}
                reportId={reportIdToEdit}
                customerName={reportCustomerNameToEdit}
                onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) {
                        setReportIdToEdit(null);
                        setReportCustomerNameToEdit("");
                    }
                }}
                onSubmit={handleEditReport}
            />
        </div>
    );
};

export default TechnicianPage;
