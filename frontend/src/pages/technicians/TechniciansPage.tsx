import CreateEntityButton from "@/components/create-entity-button";
import CreateTechnicianDialog from "@/components/dialogs/createTechnicianDialog";
import PageHeader from "@/components/page-header";
import SearchInput from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createTechnician, getApiErrorMessage, listTechnicians } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { TechnicianDto } from "@/types/dtos";
import { toast } from "sonner";

type TechnicianColumn = {
    key: keyof TechnicianDto | "actions";
    header: string;
    className?: string;
    render: (row: TechnicianDto) => ReactNode;
};

const technicianColumns: TechnicianColumn[] = [
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

const TechniciansPage = () => {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [technicianRows, setTechnicianRows] = useState<TechnicianDto[]>([]);

    const loadTechnicians = async () => {
        try {
            const technicians = await listTechnicians();
            setTechnicianRows(technicians);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i tecnici"));
        }
    };

    const handleCreateTechnician = async (values: Record<string, string | boolean>) => {
        await createTechnician({
            firstName: String(values.firstName).trim(),
            lastName: String(values.lastName).trim() === "" ? null : String(values.lastName).trim(),
            phoneNumber: String(values.phoneNumber).trim() === "" ? null : String(values.phoneNumber).trim(),
            vatNumber: String(values.vatNumber).trim() === "" ? null : String(values.vatNumber).trim(),
        });

        await loadTechnicians();
    };

    useEffect(() => {
        const loadInitialTechnicians = async () => {
            try {
                const technicians = await listTechnicians();
                setTechnicianRows(technicians);
            } catch (error) {
                toast.error(getApiErrorMessage(error, "Impossibile caricare i tecnici"));
            }
        };

        void loadInitialTechnicians();
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Tecnici"
                description="Gestisci i tecnici del laboratorio."
                action={<CreateEntityButton label="Crea nuovo tecnico" onClick={() => setIsCreateDialogOpen(true)} />}
            />

            <CreateTechnicianDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSubmit={handleCreateTechnician}
            />

            <SearchInput />

            <Table className="hidden sm:table bg-background">
                <TableHeader className="w-full">
                    <TableRow>
                        {technicianColumns.map((column) => (
                            <TableHead key={column.key} className={column.className}>
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {technicianRows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={technicianColumns.length} className="py-6 text-center text-muted-foreground">
                                Nessun tecnico disponibile.
                            </TableCell>
                        </TableRow>
                    ) : (
                        technicianRows.map((row) => (
                            <TableRow key={row.id}>
                                {technicianColumns.map((column) => (
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

export default TechniciansPage;