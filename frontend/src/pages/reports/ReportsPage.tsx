import CreateEntityButton from "@/components/create-entity-button";
import CreateReportDialog from "@/components/dialogs/create/createReportDialog";
import EditReportDialog, { type EditReportSubmitValues } from "@/components/dialogs/edit/editReportDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import PageHeader from "@/components/page-header";
import TablePagination from "@/components/table-pagination";
import {
    createReportTechnician,
    createIssue,
    createReport,
    deleteReportTechnician,
    deleteReport,
    getApiErrorMessage,
    listCustomers,
    listDevices,
    listIssues,
    getReportPrintUrl,
    updateReport,
    updateReportTechnician,
} from "@/lib/api";
import { useEffect, useState } from "react";
import type { CustomerDto, ReportDto } from "@/types/dtos";
import { toast } from "sonner";
import LoadingPage from "@/components/loadingPage";
import { useNavigate, useSearchParams } from "react-router-dom";
import { reportColumns } from "./components/report-columns";
import ReportsFilters from "./components/reports-filters";
import ReportsTable from "./components/reports-table";
import type { ReportVisibilityFilter } from "./components/types";
import { useReportsRows } from "./hooks/useReportsRows";
import { useTablePagination } from "@/hooks/useTablePagination";

const parseVisibilityFilter = (value: string | null): ReportVisibilityFilter => {
    if (value === "all" || value === "open" || value === "closed") {
        return value;
    }

    return "open";
};

const formatCustomerOption = (
    firstName: string,
    lastName: string | null,
    phoneNumber: string | null,
    phoneNumberSecondary: string | null
) => {
    const fullName = `${firstName} ${lastName ?? ""}`.trim();
    return `${fullName} - ${phoneNumber?.trim() || phoneNumberSecondary?.trim() || "N/D"}`;
};

const normalizeCustomerText = (value: string) =>
    value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

const getCustomerFullName = (firstName: string, lastName: string | null) =>
    `${firstName} ${lastName ?? ""}`.trim();

const resolveSelectedCustomer = (customers: CustomerDto[], rawValue: string) => {
    const normalizedRawValue = normalizeCustomerText(rawValue);
    const rawNameOnly = normalizeCustomerText(rawValue.split(" - ")[0] ?? rawValue);

    const exactMatches = customers.filter(
        (customer) =>
            normalizeCustomerText(
                formatCustomerOption(
                    customer.firstName,
                    customer.lastName,
                    customer.phoneNumber,
                    customer.phoneNumberSecondary
                )
            ) === normalizedRawValue
    );

    if (exactMatches.length === 1) {
        return exactMatches[0];
    }

    if (exactMatches.length > 1) {
        throw new Error("Il cliente selezionato non è univoco. Seleziona il nominativo completo.");
    }

    const nameMatches = customers.filter(
        (customer) => normalizeCustomerText(getCustomerFullName(customer.firstName, customer.lastName)) === rawNameOnly
    );

    if (nameMatches.length === 1) {
        return nameMatches[0];
    }

    if (nameMatches.length > 1) {
        throw new Error("Esistono più clienti con lo stesso nome. Seleziona quello completo con il telefono.");
    }

    return null;
};

const ReportsPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [reportIdToEdit, setReportIdToEdit] = useState<number | null>(null);
    const [reportCustomerNameToEdit, setReportCustomerNameToEdit] = useState("");
    const [reportToDelete, setReportToDelete] = useState<ReportDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [visibilityFilter, setVisibilityFilter] = useState<ReportVisibilityFilter>(() =>
        parseVisibilityFilter(searchParams.get("visibility"))
    );
    const [searchText, setSearchText] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const pageSize = 10;
    const { currentPage, setCurrentPage } = useTablePagination({
        resetDependencies: [searchText, visibilityFilter, selectedDate],
    });
    const { reportRows, totalItems, totalPages, isLoading, loadReports, updateReportRow } = useReportsRows({
        searchText,
        visibilityFilter,
        selectedDate,
        currentPage,
        pageSize,
    });

    const handleCreateReport = async (values: Record<string, string | boolean | number | null>) => {
        try {
            const [customers, devices, issues] = await Promise.all([
                listCustomers(),
                listDevices(),
                listIssues(),
            ]);

            const selectedCustomerFromId = typeof values.customerId === "number"
                ? customers.find((customer) => customer.id === values.customerId)
                : null;
            const selectedCustomer = selectedCustomerFromId ?? resolveSelectedCustomer(customers, String(values.customer));

            const selectedDevice = devices.find(
                (device) => device.name.toLowerCase() === String(values.deviceType).trim().toLowerCase()
            );

            const issueDescription = String(values.issueDescription).trim();

            if (!selectedCustomer) {
                throw new Error("Seleziona un cliente esistente o creane uno nuovo.");
            }

            if (!selectedDevice) {
                throw new Error("Seleziona una tipologia dispositivo esistente o creane una nuova.");
            }

            if (issueDescription === "") {
                throw new Error("La descrizione difetto e obbligatoria.");
            }

            let selectedIssue = issues.find(
                (issue) => issue.description.toLowerCase() === issueDescription.toLowerCase()
            );

            if (!selectedIssue) {
                try {
                    selectedIssue = await createIssue({ description: issueDescription });
                } catch {
                    const refreshedIssues = await listIssues();
                    selectedIssue = refreshedIssues.find(
                        (issue) => issue.description.toLowerCase() === issueDescription.toLowerCase()
                    );
                }
            }

            if (!selectedIssue) {
                throw new Error("Impossibile risolvere il difetto di riferimento.");
            }

            const createdReport = await createReport({
                deviceId: selectedDevice.id,
                issueId: selectedIssue.id,
                customerId: selectedCustomer.id,
                note: String(values.notes).trim() === "" ? null : String(values.notes).trim(),
                password: String(values.password).trim() === "" ? null : String(values.password).trim(),
                issueDescription,
                dataBackup: Boolean(values.dataBackup),
                charger: Boolean(values.charger),
            });

            await loadReports();

            if (window.confirm("Rapporto creato. Vuoi stamparlo adesso?")) {
                handlePrintReport(createdReport.id);
            }
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

    const handleVisibilityFilterChange = (value: ReportVisibilityFilter) => {
        setVisibilityFilter(value);
        setSearchParams(value === "open" ? {} : { visibility: value }, { replace: true });
    };

    const handleOpenEditDialog = (id: number) => {
        const report = reportRows.find((row) => row.id === id);
        setReportIdToEdit(id);
        setReportCustomerNameToEdit(report?.customer ?? "");
        setIsEditDialogOpen(true);
    };

    const handleEditReport = async (values: EditReportSubmitValues) => {
        const technicianTotal = values.technicianId == null ? 0 : values.technicianPrice;

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
            alerted: values.alerted,
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

        updateReportRow(values.reportId, (report) => ({
            ...report,
            customerId: values.customerId,
            deviceId: values.deviceId,
            issueId: values.issueId,
            collaboratorId: values.collaboratorId,
            serviceDescription: values.serviceDescription,
            note: values.note,
            password: values.password,
            dataBackup: values.dataBackup,
            charger: values.charger,
            alerted: values.alerted,
            closed: values.closed,
            paymentMethod: values.paymentMethod,
            internalPrice: values.internalPrice,
            technicianPrice: technicianTotal,
            totalPrice: values.internalPrice + technicianTotal,
        }));

        await loadReports();
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

    const handlePrintReport = (id: number) => {
        const printWindow = window.open(getReportPrintUrl(id), "_blank", "noopener,noreferrer");

        if (!printWindow) {
            toast.error("Popup bloccato dal browser. Consenti i popup per aprire la stampa.");
        }
    };

    useEffect(() => {
        setVisibilityFilter(parseVisibilityFilter(searchParams.get("visibility")));
    }, [searchParams]);

    return (
        <div className="relative flex flex-col gap-4 w-full h-full">
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

                <ReportsFilters
                    searchText={searchText}
                    onSearchTextChange={setSearchText}
                    visibilityFilter={visibilityFilter}
                    onVisibilityFilterChange={handleVisibilityFilterChange}
                    selectedDate={selectedDate}
                    onSelectedDateChange={setSelectedDate}
                />

                <div className="flex flex-col gap-4">
                    <ReportsTable
                        columns={reportColumns}
                        rows={reportRows}
                        onOpenReport={handleOpenReport}
                        onEditReport={handleOpenEditDialog}
                        onPrintReport={handlePrintReport}
                        onDeleteReport={handleOpenDeleteDialog}
                    />
                    <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                    />
                </div>

                {isLoading ? <LoadingPage className="absolute inset-0 z-10 rounded-2xl bg-background/70 backdrop-blur-sm" /> : null}
            </>
        </div>
    );
}

export default ReportsPage;