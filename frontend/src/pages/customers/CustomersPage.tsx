import CreateEntityButton from "@/components/create-entity-button";
import CreateCustomerDialog from "@/components/dialogs/create/createCustomerDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import LoadingPage from "@/components/loadingPage";
import PageHeader from "@/components/page-header";
import TablePagination from "@/components/table-pagination";
import {
    createCustomer,
    deleteCustomer,
    getApiErrorMessage,
    updateCustomer,
    getCustomerReportsPrintUrl,
    getCustomerInterventionsPrintUrl,
} from "@/lib/api";
import { useEffect, useState } from "react";
import type { CustomerDto } from "@/types/dtos";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { customerColumns } from "./components/customer-columns";
import CustomersFilters from "./components/customers-filters";
import CustomersTable from "./components/customers-table";
import { useCustomersRows } from "./hooks/useCustomersRows";
import { useTablePagination } from "@/hooks/useTablePagination";

const CustomersPage = () => {
    const navigate = useNavigate();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<CustomerDto | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<CustomerDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const pageSize = 10;
    const { currentPage, setCurrentPage } = useTablePagination({ resetDependencies: [searchText] });
    const { customerRows, totalItems, totalPages, isLoading, loadCustomers } = useCustomersRows({
        searchText,
        currentPage,
        pageSize,
    });

    const handleCreateCustomer = async (values: Record<string, string | boolean>) => {
        await createCustomer({
            firstName: String(values.firstName).trim(),
            lastName: String(values.lastName).trim() === "" ? null : String(values.lastName).trim(),
            phoneNumber: String(values.phoneNumber).trim() === "" ? null : String(values.phoneNumber).trim(),
            phoneNumberSecondary:
                String(values.phoneNumberSecondary).trim() === "" ? null : String(values.phoneNumberSecondary).trim(),
            email: String(values.email).trim() === "" ? null : String(values.email).trim(),
        });

        await loadCustomers();
    };

    const handleOpenDeleteDialog = (customer: CustomerDto) => {
        setCustomerToDelete(customer);
        setIsDeleteDialogOpen(true);
    };

    const handleOpenEditDialog = (id: number) => {
        const customer = customerRows.find((item) => item.id === id);

        if (!customer) {
            toast.error("Cliente non trovato");
            return;
        }

        setCustomerToEdit(customer);
        setIsEditDialogOpen(true);
    };

    const handleEditCustomer = async (values: Record<string, string | boolean>) => {
        if (!customerToEdit) {
            return;
        }

        await updateCustomer(customerToEdit.id, {
            firstName: String(values.firstName).trim(),
            lastName: String(values.lastName).trim() === "" ? null : String(values.lastName).trim(),
            phoneNumber: String(values.phoneNumber).trim() === "" ? null : String(values.phoneNumber).trim(),
            phoneNumberSecondary:
                String(values.phoneNumberSecondary).trim() === "" ? null : String(values.phoneNumberSecondary).trim(),
            email: String(values.email).trim() === "" ? null : String(values.email).trim(),
        });

        await loadCustomers();
    };

    const handleOpenCustomer = (id: number) => {
        navigate(`/clients/${id}`);
    };

    const handlePrintCustomerReports = (id: number) => {
        window.open(getCustomerReportsPrintUrl(id), "_blank", "noopener,noreferrer");
    };

    const handlePrintCustomerInterventions = (id: number) => {
        window.open(getCustomerInterventionsPrintUrl(id), "_blank", "noopener,noreferrer");
    };

    const handleDeleteCustomer = async () => {
        if (!customerToDelete || isDeleting) {
            return;
        }

        try {
            setIsDeleting(true);
            await deleteCustomer(customerToDelete.id);
            toast.success("Cliente eliminato con successo");
            setIsDeleteDialogOpen(false);
            setCustomerToDelete(null);
            await loadCustomers();
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile eliminare il cliente"));
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        void loadCustomers();
    }, []);

    return (
        <div className="relative flex flex-col gap-4 w-full">
            <PageHeader
                title="Clienti"
                description="Gestisci i clienti del laboratorio."
                action={<CreateEntityButton label="Crea nuovo cliente" onClick={() => setIsCreateDialogOpen(true)} />}
            />

            {isCreateDialogOpen && (
                <CreateCustomerDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                    onSubmit={handleCreateCustomer}
                />
            )}

            {isEditDialogOpen && (
                <CreateCustomerDialog
                    open={isEditDialogOpen}
                    onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (!open) {
                            setCustomerToEdit(null);
                        }
                    }}
                    mode="edit"
                    initialValues={customerToEdit}
                    onSubmit={handleEditCustomer}
                />
            )}

            {isDeleteDialogOpen && (
                <ConfirmDeleteDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open);
                        if (!open) {
                            setCustomerToDelete(null);
                        }
                    }}
                    title="Elimina cliente"
                    description={
                        customerToDelete
                            ? `Sei sicuro di voler eliminare il cliente ${customerToDelete.firstName} ${customerToDelete.lastName ?? ""}?`
                            : "Sei sicuro di voler eliminare questo cliente?"
                    }
                    isDeleting={isDeleting}
                    onConfirm={handleDeleteCustomer}
                />
            )}

            <CustomersFilters searchText={searchText} onSearchTextChange={setSearchText} />

            <div className="flex flex-col gap-4">
                <CustomersTable
                    columns={customerColumns}
                    rows={customerRows}
                    onOpenCustomer={handleOpenCustomer}
                    onPrintCustomerReports={handlePrintCustomerReports}
                    onPrintCustomerInterventions={handlePrintCustomerInterventions}
                    onEditCustomer={handleOpenEditDialog}
                    onDeleteCustomer={handleOpenDeleteDialog}
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
        </div>
    );
}

export default CustomersPage;