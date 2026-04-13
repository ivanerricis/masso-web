import CreateEntityButton from "@/components/create-entity-button";
import CreateIssueDialog from "@/components/dialogs/createIssueDialog";
import PageHeader from "@/components/page-header";
import SearchInput from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createIssue, getApiErrorMessage, listIssues } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { IssueDto } from "@/types/dtos";
import { toast } from "sonner";

type IssueColumn = {
    key: keyof IssueDto | "actions";
    header: string;
    className?: string;
    render: (row: IssueDto) => ReactNode;
};

const issueColumns: IssueColumn[] = [
    {
        key: "description",
        header: "Descrizione",
        render: (row) => row.description,
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

const IssuesPage = () => {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [issueRows, setIssueRows] = useState<IssueDto[]>([]);

    const loadIssues = async () => {
        try {
            const issues = await listIssues();
            setIssueRows(issues);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i difetti"));
        }
    };

    const handleCreateIssue = async (values: Record<string, string | boolean>) => {
        await createIssue({
            description: String(values.description).trim(),
        });

        await loadIssues();
    };

    useEffect(() => {
        const loadInitialIssues = async () => {
            try {
                const issues = await listIssues();
                setIssueRows(issues);
            } catch (error) {
                toast.error(getApiErrorMessage(error, "Impossibile caricare i difetti"));
            }
        };

        void loadInitialIssues();
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Difetti"
                description="Gestisci i difetti del laboratorio."
                action={<CreateEntityButton label="Crea nuovo difetto" onClick={() => setIsCreateDialogOpen(true)} />}
            />
            <CreateIssueDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSubmit={handleCreateIssue}
            />

            <SearchInput />

            <Table className="hidden sm:table bg-background">
                <TableHeader className="w-full">
                    <TableRow>
                        {issueColumns.map((column) => (
                            <TableHead key={column.key} className={column.className}>
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {issueRows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={issueColumns.length} className="py-6 text-center text-muted-foreground">
                                Nessun difetto disponibile.
                            </TableCell>
                        </TableRow>
                    ) : (
                        issueRows.map((row) => (
                            <TableRow key={row.id}>
                                {issueColumns.map((column) => (
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

export default IssuesPage;