import CreateEntityButton from "@/components/create-entity-button";
import CreateIssueDialog from "@/components/dialogs/create/createIssueDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import PageHeader from "@/components/page-header";
import SearchInput from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createIssue, deleteIssue, getApiErrorMessage, listIssues } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { IssueDto } from "@/types/dtos";
import { toast } from "sonner";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type IssueColumn = {
    key: keyof IssueDto | "actions";
    header: string;
    className?: string;
    render: (row: IssueDto) => ReactNode;
};

const issueColumns: IssueColumn[] = [
    {
        key: "id",
        header: "ID",
        render: (row) => row.id,
    },
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
    const navigate = useNavigate();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [issueRows, setIssueRows] = useState<IssueDto[]>([]);
    const [searchText, setSearchText] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [issueToDelete, setIssueToDelete] = useState<IssueDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleOpenDeleteDialog = (issue: IssueDto) => {
        setIssueToDelete(issue);
        setIsDeleteDialogOpen(true);
    };

    const handleOpenIssue = (id: number) => {
        navigate(`/issues/${id}`);
    };

    const handleDeleteIssue = async () => {
        if (!issueToDelete || isDeleting) {
            return;
        }

        try {
            setIsDeleting(true);
            await deleteIssue(issueToDelete.id);
            toast.success("Difetto eliminato con successo");
            setIsDeleteDialogOpen(false);
            setIssueToDelete(null);
            await loadIssues();
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile eliminare il difetto"));
        } finally {
            setIsDeleting(false);
        }
    };

    const visibleIssueRows = issueRows.filter((issue) => {
        const query = searchText.trim().toLowerCase();
        if (!query) {
            return true;
        }

        return [String(issue.id), issue.description]
            .join(" ")
            .toLowerCase()
            .includes(query);
    });

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

            <ConfirmDeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open);
                    if (!open) {
                        setIssueToDelete(null);
                    }
                }}
                title="Elimina difetto"
                description={
                    issueToDelete
                        ? `Sei sicuro di voler eliminare il difetto: ${issueToDelete.description}?`
                        : "Sei sicuro di voler eliminare questo difetto?"
                }
                isDeleting={isDeleting}
                onConfirm={handleDeleteIssue}
            />

            <SearchInput value={searchText} onValueChange={setSearchText} placeholder="Cerca difetto..." />

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
                    {visibleIssueRows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={issueColumns.length} className="py-6 text-center text-muted-foreground">
                                Nessun difetto disponibile.
                            </TableCell>
                        </TableRow>
                    ) : (
                        visibleIssueRows.map((row) => (
                            <TableRow key={row.id}>
                                {issueColumns.map((column) => (
                                    <TableCell key={`${row.id}-${column.key}`} className={column.className}>
                                        {column.key === "actions" ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="outline" size="lg" onClick={() => handleOpenIssue(row.id)}>
                                                    Apri
                                                    <ChevronRight className="size-5" />
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="icon-lg"
                                                    className="bg-primary/10 hover:bg-primary/20"
                                                    onClick={() => toast.info("Modifica non ancora disponibile")}
                                                    aria-label={`Modifica difetto ${row.id}`}
                                                >
                                                    <Pencil className="size-5 text-primary" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon-lg"
                                                    onClick={() => handleOpenDeleteDialog(row)}
                                                    aria-label={`Elimina difetto ${row.id}`}
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

export default IssuesPage;