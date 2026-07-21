import { CircleCheck, CircleDashed, Euro } from "lucide-react";
import CardDashboard from "./components/cardDashboard";
import CreateReportDialog from "@/components/dialogs/create/createReportDialog";
import LoadingPage from "@/components/loadingPage";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import CreateEntityButton from "@/components/create-entity-button";
import {
    createIssue,
    createReport,
    getReportPrintUrl,
    getApiErrorMessage,
    listCustomers,
    listDevices,
    listIssues,
    listReports,
} from "@/lib/api";
import { formatEuro } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { ReportDto } from "@/types/dtos";

const getMonthKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
};

const getMonthLabel = (monthKey: string) => {
    const [yearPart, monthPart] = monthKey.split("-");
    const year = Number(yearPart);
    const month = Number(monthPart);

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
        return monthKey;
    }

    return new Intl.DateTimeFormat("it-IT", {
        month: "long",
        year: "numeric",
    }).format(new Date(year, month - 1, 1));
};

const isSameMonth = (dateValue: string, monthKey: string) => dateValue.slice(0, 7) === monthKey;

const buildMonthOptions = (count: number) => {
    const options: Array<{ value: string; label: string }> = [];
    const now = new Date();

    for (let offset = 0; offset < count; offset += 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        const value = getMonthKey(date);
        const label = new Intl.DateTimeFormat("it-IT", {
            month: "long",
            year: "numeric",
        }).format(date);

        options.push({ value, label });
    }

    return options;
};

const DashboardPage = () => {
    const navigate = useNavigate();
    const [dialogCreateReportOpen, setDialogCreateReportOpen] = useState(false);
    const [reports, setReports] = useState<ReportDto[]>([]);
    const [selectedRevenueMonth, setSelectedRevenueMonth] = useState(() => getMonthKey(new Date()));
    const [openReports, setOpenReports] = useState(0);
    const [closedReports, setClosedReports] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const monthlyRevenue = useMemo(
        () =>
            reports
                .filter((report) => report.closed && isSameMonth(report.createdAt, selectedRevenueMonth))
                .reduce((accumulator, report) => accumulator + report.totalPrice, 0),
        [reports, selectedRevenueMonth]
    );

    const selectedRevenueLabel = useMemo(
        () => getMonthLabel(selectedRevenueMonth),
        [selectedRevenueMonth]
    );

    const monthOptions = useMemo(() => buildMonthOptions(12), []);

    const loadDashboardMetrics = async () => {
        setIsLoading(true);
        try {
            const reportsData = await listReports();
            const openCount = reportsData.filter((report) => !report.closed).length;
            const closedCount = reportsData.filter((report) => report.closed).length;

            setReports(reportsData);
            setOpenReports(openCount);
            setClosedReports(closedCount);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i dati dashboard"));
        } finally {
            setIsLoading(false);
        }
    };

    const formatCustomerOption = (
        firstName: string,
        lastName: string | null,
        phoneNumber: string | null,
        phoneNumberSecondary: string | null
    ) => {
        const fullName = `${firstName} ${lastName ?? ""}`.trim();
        return `${fullName} - ${phoneNumber?.trim() || phoneNumberSecondary?.trim() || "N/D"}`;
    };

    const handleCreateReport = async (values: Record<string, string | boolean | number | null>) => {
        const [customers, devices, issues] = await Promise.all([
            listCustomers(),
            listDevices(),
            listIssues(),
        ]);

        const selectedCustomerFromId = typeof values.customerId === "number"
            ? customers.find((customer) => customer.id === values.customerId)
            : null;

        const selectedCustomer = selectedCustomerFromId ?? customers.find(
            (customer) =>
                formatCustomerOption(
                    customer.firstName,
                    customer.lastName,
                    customer.phoneNumber,
                    customer.phoneNumberSecondary
                ) === String(values.customer)
        );

        const selectedDevice = devices.find(
            (device) => device.name.toLowerCase() === String(values.deviceType).trim().toLowerCase()
        );

        const issueDescription = String(values.issueDescription).trim();

        if (!selectedCustomer) {
            throw new Error("Seleziona un cliente esistente o creane uno nuovo.");
        }

        if (!selectedDevice) {
            throw new Error("Seleziona una tipologia dispositivo esistente o creane una nuova.");
        }

        if (issueDescription === "") {
            throw new Error("La descrizione difetto e obbligatoria.");
        }

        let selectedIssue = issues.find(
            (issue) => issue.description.toLowerCase() === issueDescription.toLowerCase()
        );

        if (!selectedIssue && Boolean(values.saveIssueInCatalog)) {
            selectedIssue = await createIssue({ description: issueDescription });
        }

        if (!selectedIssue) {
            selectedIssue = issues.find((issue) => issue.description.toLowerCase() === "altro");

            if (!selectedIssue) {
                try {
                    selectedIssue = await createIssue({ description: "Altro" });
                } catch {
                    const refreshedIssues = await listIssues();
                    selectedIssue = refreshedIssues.find((issue) => issue.description.toLowerCase() === "altro");
                }
            }
        }

        if (!selectedIssue) {
            throw new Error("Impossibile risolvere il difetto di riferimento.");
        }

        const createdReport = await createReport({
            deviceId: selectedDevice.id,
            issueId: selectedIssue.id,
            customerId: selectedCustomer.id,
            note: String(values.notes).trim() === "" ? null : String(values.notes).trim(),
            password: String(values.password).trim() === "" ? null : String(values.password).trim(),
            issueDescription,
            dataBackup: Boolean(values.dataBackup),
            charger: Boolean(values.charger),
        });

        await loadDashboardMetrics();

        if (window.confirm("Rapporto creato. Vuoi stamparlo adesso?")) {
            const printWindow = window.open(getReportPrintUrl(createdReport.id), "_blank", "noopener,noreferrer");
            if (!printWindow) {
                toast.error("Popup bloccato dal browser. Consenti i popup per aprire la stampa.");
            }
        }
    };

    useEffect(() => {
        void loadDashboardMetrics();
    }, []);

    const goToReportsPage = (visibilityFilter: "open" | "closed") => {
        navigate(`/reports?visibility=${visibilityFilter}`);
    };

    return (
        <div className="relative flex flex-col gap-4 w-full">
            <PageHeader
                title="Dashboard"
                description="Panoramica del laboratorio e stato delle riparazioni."
                action={
                    <CreateEntityButton label="Nuovo rapportino" onClick={() => setDialogCreateReportOpen(true)} />
                }
            />

            <div className="flex flex-wrap gap-4">
                <CardDashboard
                    text="Rapportini aperti"
                    icon={CircleDashed}
                    number={String(openReports)}
                    iconColor="text-destructive"
                    onClick={() => goToReportsPage("open")}
                />
                <CardDashboard
                    text="Rapportini chiusi"
                    icon={CircleCheck}
                    number={String(closedReports)}
                    iconColor="text-green-400"
                    onClick={() => goToReportsPage("closed")}
                />
                <Card className="flex flex-col gap-2! border bg-card p-6 shadow w-58 rounded-lg border-primary/20">
                    <CardHeader className="p-0 pb-2">
                        <div className="flex items-center justify-between gap-3">
                            <CardTitle className="text-primary">Incassi mese</CardTitle>
                            <Euro className="size-6 text-yellow-400" />
                        </div>
                        <CardDescription>Seleziona un mese per confrontare i ricavi.</CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-3 p-0">
                        <div>
                            <div className="text-3xl font-bold">{formatEuro(monthlyRevenue)}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{selectedRevenueLabel}</div>
                        </div>

                        <Select value={selectedRevenueMonth} onValueChange={setSelectedRevenueMonth}>
                            <SelectTrigger id="dashboardRevenueMonth" className="w-full">
                                <SelectValue placeholder="Seleziona mese" />
                            </SelectTrigger>
                            <SelectContent>
                                {monthOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            </div>

            {isLoading ? <LoadingPage className="absolute inset-0 z-10 rounded-2xl bg-background/70 backdrop-blur-sm" /> : null}

            <CreateReportDialog
                open={dialogCreateReportOpen}
                onOpenChange={setDialogCreateReportOpen}
                onSubmit={handleCreateReport}
            />
        </div>
    );
}

export default DashboardPage;