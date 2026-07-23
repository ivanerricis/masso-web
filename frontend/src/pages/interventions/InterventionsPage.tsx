import CreateEntityButton from "@/components/create-entity-button";
import CreateInterventionDialog, { type CreateInterventionSubmitValues } from "@/components/dialogs/create/createInterventionDialog";
import EditInterventionDialog, { type EditInterventionSubmitValues } from "@/components/dialogs/edit/editInterventionDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import PageHeader from "@/components/page-header";
import TablePagination from "@/components/table-pagination";
import {
    createIntervention,
    deleteIntervention,
    getApiErrorMessage,
    getInterventionPrintUrl,
    listCustomers,
    updateIntervention,
} from "@/lib/api";
import { useState } from "react";
import type { CustomerDto, InterventionDto } from "@/types/dtos";
import { toast } from "sonner";
import LoadingPage from "@/components/loadingPage";
import { useNavigate } from "react-router-dom";
import { interventionColumns } from "./components/intervention-columns";
import InterventionsFilters from "./components/interventions-filters";
import InterventionsTable from "./components/interventions-table";
import type { InterventionStatusFilter, InterventionTypeFilter } from "./components/types";
import { useInterventionsRows } from "./hooks/useInterventionsRows";
import { useTablePagination } from "@/hooks/useTablePagination";

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
        .replace(/[̀-ͯ]/g, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

const getCustomerFullName = (firstName: string, lastName: string | null) => `${firstName} ${lastName ?? ""}`.trim();

const resolveSelectedCustomer = (customers: CustomerDto[], rawValue: string) => {
    const normalizedRawValue = normalizeCustomerText(rawValue);
    const rawNameOnly = normalizeCustomerText(rawValue.split(" - ")[0] ?? rawValue);

    const exactMatches = customers.filter(
        (customer) =>
            normalizeCustomerText(
                formatCustomerOption(customer.firstName, customer.lastName, customer.phoneNumber, customer.phoneNumberSecondary)
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

const InterventionsPage = () => {
    const navigate = useNavigate();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [interventionIdToEdit, setInterventionIdToEdit] = useState<number | null>(null);
    const [interventionCustomerNameToEdit, setInterventionCustomerNameToEdit] = useState("");
    const [interventionToDelete, setInterventionToDelete] = useState<InterventionDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState<InterventionStatusFilter>("all");
    const [typeFilter, setTypeFilter] = useState<InterventionTypeFilter>("all");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const pageSize = 10;
    const { currentPage, setCurrentPage } = useTablePagination({
        resetDependencies: [searchText, statusFilter, typeFilter, selectedDate],
    });
    const { interventionRows, totalItems, totalPages, isLoading, loadInterventions, updateInterventionRow } = useInterventionsRows({
        searchText,
        statusFilter,
        typeFilter,
        selectedDate,
        currentPage,
        pageSize,
    });

    const handleCreateIntervention = async (values: CreateInterventionSubmitValues) => {
        try {
            let customerId = values.customerId;

            if (customerId == null) {
                const customers = await listCustomers();
                const selectedCustomer = resolveSelectedCustomer(customers, values.customer);

                if (!selectedCustomer) {
                    throw new Error("Seleziona un cliente esistente o creane uno nuovo.");
                }

                customerId = selectedCustomer.id;
            }

            const createdIntervention = await createIntervention({
                type: values.type,
                status: values.status,
                description: values.description,
                customerId,
                collaboratorId: values.collaboratorId,
                interventionDate: values.interventionDate,
                startTime: values.startTime,
                endTime: values.endTime,
            });

            await loadInterventions();

            if (window.confirm("Intervento creato. Vuoi stamparlo adesso?")) {
                handlePrintIntervention(createdIntervention.id);
            }
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile creare l'intervento"));
            throw error;
        }
    };

    const handleOpenDeleteDialog = (intervention: InterventionDto) => {
        setInterventionToDelete(intervention);
        setIsDeleteDialogOpen(true);
    };

    const handleOpenIntervention = (id: number) => {
        navigate(`/interventions/${id}`);
    };

    const handleOpenEditDialog = (id: number) => {
        const intervention = interventionRows.find((row) => row.id === id);
        setInterventionIdToEdit(id);
        setInterventionCustomerNameToEdit(intervention?.customer ?? "");
        setIsEditDialogOpen(true);
    };

    const handleEditIntervention = async (values: EditInterventionSubmitValues) => {
        await updateIntervention(values.interventionId, {
            type: values.type,
            status: values.status,
            description: values.description,
            collaboratorId: values.collaboratorId,
            interventionDate: values.interventionDate,
            startTime: values.startTime,
            endTime: values.endTime,
        });

        updateInterventionRow(values.interventionId, (intervention) => ({
            ...intervention,
            type: values.type,
            status: values.status,
            description: values.description,
            collaboratorId: values.collaboratorId,
            interventionDate: values.interventionDate,
            startTime: values.startTime,
            endTime: values.endTime,
        }));

        await loadInterventions();
    };

    const handleDeleteIntervention = async () => {
        if (!interventionToDelete || isDeleting) {
            return;
        }

        try {
            setIsDeleting(true);
            await deleteIntervention(interventionToDelete.id);
            toast.success("Intervento eliminato con successo");
            setIsDeleteDialogOpen(false);
            setInterventionToDelete(null);
            await loadInterventions();
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile eliminare l'intervento"));
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePrintIntervention = (id: number) => {
        const printWindow = window.open(getInterventionPrintUrl(id), "_blank", "noopener,noreferrer");

        if (!printWindow) {
            toast.error("Popup bloccato dal browser. Consenti i popup per aprire la stampa.");
        }
    };

    return (
        <div className="relative flex flex-col gap-4 w-full h-full">
            <>
                <PageHeader
                    title="Interventi"
                    description="Gestisci consegne materiale e interventi in sede o da remoto."
                    action={<CreateEntityButton label="Crea nuovo intervento" onClick={() => setIsCreateDialogOpen(true)} />}
                />

                <CreateInterventionDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                    onSubmit={handleCreateIntervention}
                />

                <EditInterventionDialog
                    open={isEditDialogOpen}
                    interventionId={interventionIdToEdit}
                    customerName={interventionCustomerNameToEdit}
                    onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (!open) {
                            setInterventionIdToEdit(null);
                            setInterventionCustomerNameToEdit("");
                        }
                    }}
                    onSubmit={handleEditIntervention}
                />

                <ConfirmDeleteDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open);
                        if (!open) {
                            setInterventionToDelete(null);
                        }
                    }}
                    title="Elimina intervento"
                    description={
                        interventionToDelete
                            ? `Sei sicuro di voler eliminare l'intervento ID ${interventionToDelete.id}?`
                            : "Sei sicuro di voler eliminare questo intervento?"
                    }
                    isDeleting={isDeleting}
                    onConfirm={handleDeleteIntervention}
                />

                <InterventionsFilters
                    searchText={searchText}
                    onSearchTextChange={setSearchText}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    typeFilter={typeFilter}
                    onTypeFilterChange={setTypeFilter}
                    selectedDate={selectedDate}
                    onSelectedDateChange={setSelectedDate}
                />

                <div className="flex flex-col gap-4">
                    <InterventionsTable
                        columns={interventionColumns}
                        rows={interventionRows}
                        onOpenIntervention={handleOpenIntervention}
                        onEditIntervention={handleOpenEditDialog}
                        onPrintIntervention={handlePrintIntervention}
                        onDeleteIntervention={handleOpenDeleteDialog}
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
};

export default InterventionsPage;
