import CreateEntityButton from "@/components/create-entity-button";
import CreateIssueDialog from "@/components/dialogs/create/createIssueDialog";
import ConfirmDeleteDialog from "@/components/dialogs/delete/confirmDeleteDialog";
import PageHeader from "@/components/page-header";
import { createIssue, deleteIssue, getApiErrorMessage, updateIssue } from "@/lib/api";
import { useEffect, useState } from "react";
import type { IssueDto } from "@/types/dtos";
import { toast } from "sonner";
import TableLoadingSkeleton from "@/components/tableLoadingSkeleton";
import { issueColumns } from "./components/issue-columns";
import IssuesFilters from "./components/issues-filters";
import IssuesTable from "./components/issues-table";
import { useIssuesRows } from "./hooks/useIssuesRows";

const IssuesPage = () => {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [issueToEdit, setIssueToEdit] = useState<IssueDto | null>(null);
    const [issueToDelete, setIssueToDelete] = useState<IssueDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { issueRows, visibleIssueRows, isLoading, loadIssues } = useIssuesRows({ searchText });

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

    const handleOpenEditDialog = (id: number) => {
        const issue = issueRows.find((item) => item.id === id);

        if (!issue) {
            toast.error("Difetto non trovato");
            return;
        }

        setIssueToEdit(issue);
        setIsEditDialogOpen(true);
    };

    const handleEditIssue = async (values: Record<string, string | boolean>) => {
        if (!issueToEdit) {
            return;
        }

        await updateIssue(issueToEdit.id, {
            description: String(values.description).trim(),
        });

        await loadIssues();
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

    useEffect(() => {
        void loadIssues();
    }, []);

    return (
        <div className="flex flex-col gap-4 w-full">
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

            <CreateIssueDialog
                open={isEditDialogOpen}
                onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) {
                        setIssueToEdit(null);
                    }
                }}
                mode="edit"
                initialValues={issueToEdit}
                onSubmit={handleEditIssue}
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

            <IssuesFilters searchText={searchText} onSearchTextChange={setSearchText} />

            {isLoading && issueRows.length === 0 ? (
                <TableLoadingSkeleton columns={issueColumns.length} />
            ) : (
                <IssuesTable
                    columns={issueColumns}
                    rows={visibleIssueRows}
                    onEditIssue={handleOpenEditDialog}
                    onDeleteIssue={handleOpenDeleteDialog}
                />
            )}
        </div>
    );
}

export default IssuesPage;