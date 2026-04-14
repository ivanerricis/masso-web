import CreateEntityButton from "@/components/create-entity-button";
import CreateCustomerDialog from "@/components/dialogs/create/createCustomerDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import PageHeader from "@/components/page-header";
import SearchInput from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createCustomer, deleteCustomer, getApiErrorMessage, listCustomers } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { CustomerDto } from "@/types/dtos";
import { toast } from "sonner";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type CustomerColumn = {
    key: keyof CustomerDto | "actions";
    header: string;
    className?: string;
    render: (row: CustomerDto) => ReactNode;
};

const customerColumns: CustomerColumn[] = [
    {
        key: "id",
        header: "ID",
        render: (row) => row.id,
    },
    {
        key: "firstName",
        header: "Nome",
        render: (row) => row.firstName,
    },
    {
        key: "lastName",
        header: "Cognome",
        render: (row) => row.lastName ?? "-",
    },
    {
        key: "phoneNumber",
        header: "Telefono",
        render: (row) => row.phoneNumber ?? "-",
    },
    {
        key: "email",
        header: "Email",
        render: (row) => row.email ?? "-",
    },
    {
        key: "vatNumber",
        header: "Partita IVA",
        render: (row) => row.vatNumber ?? "-",
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

const CustomersPage = () => {
    const navigate = useNavigate();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [customerRows, setCustomerRows] = useState<CustomerDto[]>([]);
    const [searchText, setSearchText] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<CustomerDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadCustomers = async () => {
        try {
            const customers = await listCustomers();
            setCustomerRows(customers);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i clienti"));
        }
    };

    const handleCreateCustomer = async (values: Record<string, string | boolean>) => {
        await createCustomer({
            firstName: String(values.firstName).trim(),
            lastName: String(values.lastName).trim() === "" ? null : String(values.lastName).trim(),
            phoneNumber: String(values.phoneNumber).trim() === "" ? null : String(values.phoneNumber).trim(),
            email: String(values.email).trim() === "" ? null : String(values.email).trim(),
            vatNumber: String(values.vatNumber).trim() === "" ? null : String(values.vatNumber).trim(),
        });

        await loadCustomers();
    };

    const handleOpenDeleteDialog = (customer: CustomerDto) => {
        setCustomerToDelete(customer);
        setIsDeleteDialogOpen(true);
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

    const visibleCustomerRows = customerRows.filter((customer) => {
        const query = searchText.trim().toLowerCase();
        if (!query) {
            return true;
        }

        return [
            String(customer.id),
            customer.firstName,
            customer.lastName ?? "",
            customer.phoneNumber ?? "",
            customer.email ?? "",
            customer.vatNumber ?? "",
        ]
            .join(" ")
            .toLowerCase()
            .includes(query);
    });

    useEffect(() => {
        const loadInitialCustomers = async () => {
            try {
                const customers = await listCustomers();
                setCustomerRows(customers);
            } catch (error) {
                toast.error(getApiErrorMessage(error, "Impossibile caricare i clienti"));
            }
        };

        void loadInitialCustomers();
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

            <SearchInput value={searchText} onValueChange={setSearchText} placeholder="Cerca cliente..." />

            <Table className="hidden sm:table bg-background">
                <TableHeader className="w-full">
                    <TableRow>
                        {customerColumns.map((column) => (
                            <TableHead key={column.key} className={column.className}>
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {visibleCustomerRows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={customerColumns.length} className="py-6 text-center text-muted-foreground">
                                Nessun cliente disponibile.
                            </TableCell>
                        </TableRow>
                    ) : (
                        visibleCustomerRows.map((row) => (
                            <TableRow key={row.id}>
                                {customerColumns.map((column) => (
                                    <TableCell key={`${row.id}-${column.key}`} className={column.className}>
                                        {column.key === "actions" ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="outline" size="lg" onClick={() => handleOpenCustomer(row.id)}>
                                                    Apri
                                                    <ChevronRight className="size-5" />
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="icon-lg"
                                                    className="bg-primary/10 hover:bg-primary/20"
                                                    onClick={() => toast.info("Modifica non ancora disponibile")}
                                                    aria-label={`Modifica cliente ${row.id}`}
                                                >
                                                    <Pencil className="size-5 text-primary" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon-lg"
                                                    onClick={() => handleOpenDeleteDialog(row)}
                                                    aria-label={`Elimina cliente ${row.id}`}
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
        </div>
    );
}

export default CustomersPage;