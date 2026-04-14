import CreateEntityButton from "@/components/create-entity-button";
import CreateReportDialog from "@/components/dialogs/create/createReportDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import PageHeader from "@/components/page-header";
import {
    createIssue,
    createReport,
    deleteReport,
    getApiErrorMessage,
    listCustomers,
    listDevices,
    listIssues,
    getReportPrintUrl,
} from "@/lib/api";
import { useEffect, useState } from "react";
import type { ReportDto } from "@/types/dtos";
import { toast } from "sonner";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { useNavigate } from "react-router-dom";
import { reportColumns } from "./components/report-columns";
import ReportsFilters from "./components/reports-filters";
import ReportsTable from "./components/reports-table";
import type { ReportVisibilityFilter } from "./components/types";
import { useReportsRows } from "./hooks/useReportsRows";

const formatCustomerOption = (firstName: string, lastName: string | null, phoneNumber: string | null) => {
    const fullName = `${firstName} ${lastName ?? ""}`.trim();
    return `${fullName} - ${phoneNumber?.trim() || "N/D"}`;
};

const ReportsPage = () => {
    const navigate = useNavigate();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<ReportDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [visibilityFilter, setVisibilityFilter] = useState<ReportVisibilityFilter>("open");
    const [searchText, setSearchText] = useState("");
    const { reportRows, visibleReportRows, isLoading, loadReports } = useReportsRows({
        searchText,
        visibilityFilter,
    });

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

            if (!selectedIssue && Boolean(values.saveIssueInCatalog)) {
                selectedIssue = await createIssue({ description: issueDescription });
            }

            if (!selectedIssue) {
                selectedIssue = issues.find((issue) => issue.description.toLowerCase() === "altro");

                if (!selectedIssue) {
                    try {
                        selectedIssue = await createIssue({ description: "Altro" });
                    } catch {
                        const refreshedIssues = await listIssues();
                        selectedIssue = refreshedIssues.find((issue) => issue.description.toLowerCase() === "altro");
                    }
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
        void loadReports();
    }, []);

    return (
        <div className="flex flex-col gap-4 w-full h-full">
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

                <ReportsFilters
                    searchText={searchText}
                    onSearchTextChange={setSearchText}
                    visibilityFilter={visibilityFilter}
                    onVisibilityFilterChange={setVisibilityFilter}
                />

                {isLoading && reportRows.length === 0 ? (
                    <TableLoadingSkeleton columns={reportColumns.length} />
                ) : (
                    <ReportsTable
                        columns={reportColumns}
                        rows={visibleReportRows}
                        onOpenReport={handleOpenReport}
                        onEditReport={() => toast.info("Modifica non ancora disponibile")}
                        onPrintReport={handlePrintReport}
                        onDeleteReport={handleOpenDeleteDialog}
                    />
                )}
            </>
        </div>
    );
}

export default ReportsPage;