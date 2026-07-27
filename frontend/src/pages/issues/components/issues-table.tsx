import EntityCardList from "@/components/entity-card-list";
import TableActionButton from "@/components/table-action-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { IssueDto } from "@/types/dtos";
import { Pencil, Trash2 } from "lucide-react";
import type { IssueColumn } from "./issue-columns";

type IssuesTableProps = {
    columns: IssueColumn[];
    rows: IssueDto[];
    onEditIssue: (id: number) => void;
    onDeleteIssue: (issue: IssueDto) => void;
};

const IssuesTable = ({ columns, rows, onEditIssue, onDeleteIssue }: IssuesTableProps) => {
    const renderRowActions = (row: IssueDto) => (
        <>
            <TableActionButton
                variant="default"
                size="icon-lg"
                className="bg-primary/10 hover:bg-primary/20"
                onClick={() => onEditIssue(row.id)}
                aria-label={`Modifica difetto ${row.id}`}
            >
                <Pencil className="size-5 text-primary" />
            </TableActionButton>
            <TableActionButton
                variant="destructive"
                size="icon-lg"
                onClick={() => onDeleteIssue(row)}
                aria-label={`Elimina difetto ${row.id}`}
            >
                <Trash2 className="size-5" />
            </TableActionButton>
        </>
    );

    return (
        <>
        <Table className="hidden sm:table bg-background">
            <TableHeader className="w-full">
                <TableRow>
                    {columns.map((column) => (
                        <TableHead key={column.key} className={column.className}>
                            {column.header}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody className="overflow-y-auto">
                {rows.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={columns.length} className="py-6 text-center text-muted-foreground">
                            Nessun difetto disponibile.
                        </TableCell>
                    </TableRow>
                ) : (
                    rows.map((row) => (
                        <TableRow key={row.id}>
                            {columns.map((column) => (
                                <TableCell key={`${row.id}-${column.key}`} className={column.className}>
                                    {column.key === "actions" ? (
                                        <div className="flex items-center justify-end gap-2">
                                            {renderRowActions(row)}
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

        <EntityCardList
            className="sm:hidden"
            columns={columns.filter((column) => column.key !== "actions")}
            rows={rows}
            getRowKey={(row) => row.id}
            renderActions={renderRowActions}
            emptyMessage="Nessun difetto disponibile."
        />
        </>
    );
};

export default IssuesTable;
