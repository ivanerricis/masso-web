import {
    getApiErrorMessage,
    listCustomers,
    listDevices,
    listIssues,
    listReports,
    listReportTechnicians,
} from "@/lib/api";
import type { ReportDto } from "@/types/dtos";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { ReportVisibilityFilter } from "../components/types";

type UseReportsRowsParams = {
    searchText: string;
    visibilityFilter: ReportVisibilityFilter;
    selectedDate?: Date;
};

export const useReportsRows = ({ searchText, visibilityFilter, selectedDate }: UseReportsRowsParams) => {
    const [reportRows, setReportRows] = useState<ReportDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadReports = useCallback(async () => {
        setIsLoading(true);
        try {
            const [reports, customers, devices, issues, reportTechnicians] = await Promise.all([
                listReports(),
                listCustomers(),
                listDevices(),
                listIssues(),
                listReportTechnicians(),
            ]);

            const customerById = new Map(customers.map((customer) => [customer.id, customer]));
            const deviceById = new Map(devices.map((device) => [device.id, device]));
            const issueById = new Map(issues.map((issue) => [issue.id, issue]));
            const techniciansPriceByReportId = new Map<number, number>();

            for (const item of reportTechnicians) {
                techniciansPriceByReportId.set(item.reportId, (techniciansPriceByReportId.get(item.reportId) ?? 0) + item.price);
            }

            const mappedRows: ReportDto[] = reports.map((report) => {
                const customer = customerById.get(report.customerId);
                const device = deviceById.get(report.deviceId);
                const issue = issueById.get(report.issueId);
                const techniciansPrice = techniciansPriceByReportId.get(report.id) ?? 0;

                return {
                    id: report.id,
                    customer: customer ? `${customer.firstName} ${customer.lastName ?? ""}`.trim() : "-",
                    customerPhone: customer?.phoneNumber ?? customer?.phoneNumberSecondary ?? null,
                    device: device?.name ?? "-",
                    issue: issue?.description ?? "-",
                    password: report.password,
                    paymentMethod: report.paymentMethod,
                    charger: report.charger,
                    dataBackup: report.dataBackup,
                    technician: "-",
                    internalPrice: report.price,
                    technicianPrice: techniciansPrice,
                    totalPrice: report.price + techniciansPrice,
                    closed: report.closed,
                    toInvoice: report.toInvoice,
                    createdAt: report.created_at,
                    updatedAt: report.updated_at,
                };
            });

            setReportRows(mappedRows);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i rapporti"));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const visibleReportRows = useMemo(() => {
        return reportRows.filter((report) => {
            const query = searchText.trim().toLowerCase();
            const matchesSearch = !query
                ? true
                : [
                        String(report.id),
                        report.customer,
                        report.customerPhone ?? "",
                        report.device,
                        report.issue,
                        report.password ?? "",
                        report.internalPrice,
                        report.technicianPrice,
                        report.totalPrice,
                        report.closed ? "chiuso" : "aperto",
                        report.toInvoice ? "da fatturare" : "non fatturare",
                        report.dataBackup ? "backup dati" : "",
                        report.charger ? "alimentatore" : "",
                  ]
                        .join(" ")
                        .toLowerCase()
                        .includes(query);

            if (!matchesSearch) {
                return false;
            }

            if (visibilityFilter === "open" && report.closed) {
                return false;
            }

            if (visibilityFilter === "closed" && !report.closed) {
                return false;
            }

            if (selectedDate) {
                const reportDate = new Date(report.createdAt);

                if (
                    Number.isNaN(reportDate.getTime()) ||
                    reportDate.getFullYear() !== selectedDate.getFullYear() ||
                    reportDate.getMonth() !== selectedDate.getMonth() ||
                    reportDate.getDate() !== selectedDate.getDate()
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [reportRows, searchText, visibilityFilter, selectedDate]);

    return {
        reportRows,
        visibleReportRows,
        isLoading,
        loadReports,
    };
};
