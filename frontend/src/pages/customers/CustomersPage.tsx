import CreateEntityButton from "@/components/create-entity-button";
import CreateCustomerDialog from "@/components/dialogs/createCustomerDialog";
import PageHeader from "@/components/page-header";
import SearchInput from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createCustomer, getApiErrorMessage, listCustomers } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { CustomerDto } from "@/types/dtos";
import { toast } from "sonner";

type CustomerColumn = {
    key: keyof CustomerDto | "actions";
    header: string;
    className?: string;
    render: (row: CustomerDto) => ReactNode;
};

const customerColumns: CustomerColumn[] = [
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
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [customerRows, setCustomerRows] = useState<CustomerDto[]>([]);

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

            <SearchInput />

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
                    {customerRows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={customerColumns.length} className="py-6 text-center text-muted-foreground">
                                Nessun cliente disponibile.
                            </TableCell>
                        </TableRow>
                    ) : (
                        customerRows.map((row) => (
                            <TableRow key={row.id}>
                                {customerColumns.map((column) => (
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

export default CustomersPage;