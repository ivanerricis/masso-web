import { formatDateTime, formatEuro } from "@/lib/utils";
import type { ReportDto } from "@/types/dtos";
import type { ReactNode } from "react";

export type ReportColumn = {
    key: keyof ReportDto | "actions";
    header: string;
    className?: string;
    render: (row: ReportDto) => ReactNode;
};

export const reportColumns: ReportColumn[] = [
    {
        key: "id",
        header: "ID",
        render: (row) => row.id,
    },
    {
        key: "customer",
        header: "Cliente",
        render: (row) => row.customer,
    },
    {
        key: "device",
        header: "Dispositivo",
        render: (row) => row.device,
    },
    {
        key: "issue",
        header: "Difetto",
        render: (row) => row.issue,
    },
    {
        key: "password",
        header: "Password",
        render: (row) => row.password ?? "-",
    },
    {
        key: "dataBackup",
        header: "Backup dati",
        render: (row) => (row.dataBackup ? "Si" : "No"),
    },
    {
        key: "charger",
        header: "Alimentatore",
        render: (row) => (row.charger ? "Si" : "No"),
    },
    {
        key: "internalPrice",
        header: "Prezzo interno",
        render: (row) => formatEuro(row.internalPrice),
    },
    {
        key: "technicianPrice",
        header: "Prezzo tecnico",
        render: (row) => formatEuro(row.technicianPrice),
    },
    {
        key: "totalPrice",
        header: "Prezzo totale",
        render: (row) => formatEuro(row.totalPrice),
    },
    {
        key: "closed",
        header: "Chiuso",
        render: (row) => (row.closed ? "Si" : "No"),
    },
    {
        key: "toInvoice",
        header: "Da fatturare",
        render: (row) => (row.toInvoice ? "Si" : "No"),
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
        render: () => null,
    },
];
