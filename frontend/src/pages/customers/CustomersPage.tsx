import CreateEntityButton from "@/components/create-entity-button";
import CreateCustomerDialog from "@/components/dialogs/create/createCustomerDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import PageHeader from "@/components/page-header";
import { createCustomer, deleteCustomer, getApiErrorMessage, updateCustomer } from "@/lib/api";
import { useEffect, useState } from "react";
import type { CustomerDto } from "@/types/dtos";
import { toast } from "sonner";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { useNavigate } from "react-router-dom";
import { customerColumns } from "./components/customer-columns";
import CustomersFilters from "./components/customers-filters";
import CustomersTable from "./components/customers-table";
import { useCustomersRows } from "./hooks/useCustomersRows";

const CustomersPage = () => {
    const navigate = useNavigate();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<CustomerDto | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<CustomerDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { customerRows, visibleCustomerRows, isLoading, loadCustomers } = useCustomersRows({ searchText });

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
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Clienti"
                description="Gestisci i clienti del laboratorio."
                action={<CreateEntityButton label="Crea nuovo cliente" onClick={() => setIsCreateDialogOpen(true)} />}
            />

            <CreateCustomerDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSubmit={handleCreateCustomer}
            />

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

            <CustomersFilters searchText={searchText} onSearchTextChange={setSearchText} />

            {isLoading && customerRows.length === 0 ? (
                <TableLoadingSkeleton columns={customerColumns.length} />
            ) : (
                <CustomersTable
                    columns={customerColumns}
                    rows={visibleCustomerRows}
                    onOpenCustomer={handleOpenCustomer}
                    onEditCustomer={handleOpenEditDialog}
                    onDeleteCustomer={handleOpenDeleteDialog}
                />
            )}
        </div>
    );
}

export default CustomersPage;