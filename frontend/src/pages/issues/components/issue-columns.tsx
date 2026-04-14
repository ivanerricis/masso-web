import { formatDate } from "@/lib/utils";
import type { IssueDto } from "@/types/dtos";
import type { ReactNode } from "react";

export type IssueColumn = {
    key: keyof IssueDto | "actions";
    header: string;
    className?: string;
    render: (row: IssueDto) => ReactNode;
};

export const issueColumns: IssueColumn[] = [
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
        render: (row) => formatDate(row.createdAt),
    },
    {
        key: "actions",
        header: "Azioni",
        className: "text-right",
        render: () => null,
    },
];
