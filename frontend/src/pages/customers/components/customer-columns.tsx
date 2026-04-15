import { formatDate } from "@/lib/utils";
import type { CustomerDto } from "@/types/dtos";
import type { ReactNode } from "react";

export type CustomerColumn = {
    key: keyof CustomerDto | "actions";
    header: string;
    className?: string;
    render: (row: CustomerDto) => ReactNode;
};

export const customerColumns: CustomerColumn[] = [
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
        header: "Telefono 1",
        render: (row) => row.phoneNumber ?? "-",
    },
    {
        key: "phoneNumberSecondary",
        header: "Telefono 2",
        render: (row) => row.phoneNumberSecondary ?? "-",
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
        render: (row) => formatDate(row.createdAt),
    },
    {
        key: "actions",
        header: "Azioni",
        className: "text-right",
        render: () => null,
    },
];
