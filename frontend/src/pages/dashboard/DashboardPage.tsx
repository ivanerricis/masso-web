import { ChevronLeft, ChevronRight, CircleCheck, CircleDashed, Euro } from "lucide-react";
import CardDashboard from "./components/cardDashboard";
import CreateReportDialog from "@/components/dialogs/create/createReportDialog";
import LoadingPage from "@/components/loadingPage";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { startTransition, useEffect, useMemo, useState } from "react";
import CreateEntityButton from "@/components/create-entity-button";
import {
    createIssue,
    createReport,
    getReportPrintUrl,
    getApiErrorMessage,
    getReportStats,
    listCustomers,
    listDevices,
    listIssues,
} from "@/lib/api";
import { cn, formatEuro } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

const getMonthShortLabel = (monthKey: string) => {
    const [yearPart, monthPart] = monthKey.split("-");

    return new Intl.DateTimeFormat("it-IT", { month: "short" }).format(
        new Date(Number(yearPart), Number(monthPart) - 1, 1)
    );
};

const shiftMonthKey = (monthKey: string, deltaMonths: number) => {
    const [yearPart, monthPart] = monthKey.split("-");
    const date = new Date(Number(yearPart), Number(monthPart) - 1 + deltaMonths, 1);

    return getMonthKey(date);
};

const DashboardPage = () => {
    const navigate = useNavigate();
    const [dialogCreateReportOpen, setDialogCreateReportOpen] = useState(false);
    const [selectedRevenueMonth, setSelectedRevenueMonth] = useState(() => getMonthKey(new Date()));
    const [openReports, setOpenReports] = useState(0);
    const [closedReports, setClosedReports] = useState(0);
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [monthlyRevenueSeries, setMonthlyRevenueSeries] = useState<{ monthKey: string; value: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const selectedRevenueLabel = useMemo(
        () => getMonthLabel(selectedRevenueMonth),
        [selectedRevenueMonth]
    );

    const isCurrentRevenueMonth = selectedRevenueMonth === getMonthKey(new Date());

    const handlePreviousRevenueMonth = () => setSelectedRevenueMonth((prev) => shiftMonthKey(prev, -1));
    const handleNextRevenueMonth = () => {
        if (isCurrentRevenueMonth) {
            return;
        }
        setSelectedRevenueMonth((prev) => shiftMonthKey(prev, 1));
    };

    const maxMonthlyRevenue = useMemo(
        () => monthlyRevenueSeries.reduce((max, point) => Math.max(max, point.value), 0),
        [monthlyRevenueSeries]
    );

    const loadDashboardMetrics = async (month: string) => {
        setIsLoading(true);
        try {
            const stats = await getReportStats(month);

            setOpenReports(stats.openCount);
            setClosedReports(stats.closedCount);
            setMonthlyRevenue(stats.monthlyRevenue);
            setMonthlyRevenueSeries(stats.series);
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
        const issueDescription = String(values.issueDescription).trim();

        if (issueDescription === "") {
            throw new Error("La descrizione difetto e obbligatoria.");
        }

        // The dialog already resolves customer/device/issue ids from the catalogs it
        // loaded on open, so the common path needs no extra network round trip. These
        // fetches only run as a fallback for values the dialog couldn't map to an id.
        let customerId = typeof values.customerId === "number" ? values.customerId : null;
        let deviceId = typeof values.deviceId === "number" ? values.deviceId : null;
        let issueId = typeof values.issueId === "number" ? values.issueId : null;

        if (customerId == null) {
            const customers = await listCustomers();
            const selectedCustomer = customers.find(
                (customer) =>
                    formatCustomerOption(
                        customer.firstName,
                        customer.lastName,
                        customer.phoneNumber,
                        customer.phoneNumberSecondary
                    ) === String(values.customer)
            );

            if (!selectedCustomer) {
                throw new Error("Seleziona un cliente esistente o creane uno nuovo.");
            }

            customerId = selectedCustomer.id;
        }

        if (deviceId == null) {
            const devices = await listDevices();
            const selectedDevice = devices.find(
                (device) => device.name.toLowerCase() === String(values.deviceType).trim().toLowerCase()
            );

            if (!selectedDevice) {
                throw new Error("Seleziona una tipologia dispositivo esistente o creane una nuova.");
            }

            deviceId = selectedDevice.id;
        }

        if (issueId == null) {
            const issues = await listIssues();
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

            issueId = selectedIssue.id;
        }

        const createdReport = await createReport({
            deviceId,
            issueId,
            customerId,
            note: String(values.notes).trim() === "" ? null : String(values.notes).trim(),
            password: String(values.password).trim() === "" ? null : String(values.password).trim(),
            issueDescription,
            dataBackup: Boolean(values.dataBackup),
            charger: Boolean(values.charger),
        });

        await loadDashboardMetrics(selectedRevenueMonth);

        if (window.confirm("Rapporto creato. Vuoi stamparlo adesso?")) {
            const printWindow = window.open(getReportPrintUrl(createdReport.id), "_blank", "noopener,noreferrer");
            if (!printWindow) {
                toast.error("Popup bloccato dal browser. Consenti i popup per aprire la stampa.");
            }
        }
    };

    useEffect(() => {
        startTransition(() => {
            void loadDashboardMetrics(selectedRevenueMonth);
        });
    }, [selectedRevenueMonth]);

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
                <Card className="flex flex-col gap-3! border bg-card p-6 shadow w-72 rounded-lg border-primary/20">
                    <CardHeader className="p-0 pb-1">
                        <div className="flex items-center justify-between gap-3">
                            <CardTitle className="text-primary">Incassi mese</CardTitle>
                            <Euro className="size-6 text-yellow-400" />
                        </div>
                        <CardDescription>Andamento degli ultimi 6 mesi.</CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-3 p-0">
                        <div className="flex items-center justify-between gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={handlePreviousRevenueMonth}
                                aria-label="Mese precedente"
                            >
                                <ChevronLeft className="size-4" />
                            </Button>

                            <div className="text-center">
                                <div className="text-3xl font-bold">{formatEuro(monthlyRevenue)}</div>
                                <div className="mt-1 text-sm text-muted-foreground">{selectedRevenueLabel}</div>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={handleNextRevenueMonth}
                                disabled={isCurrentRevenueMonth}
                                aria-label="Mese successivo"
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>

                        <div className="flex h-16 items-end gap-1.5 border-b border-border">
                            {monthlyRevenueSeries.map((point) => {
                                const isSelected = point.monthKey === selectedRevenueMonth;
                                const shortLabel = getMonthShortLabel(point.monthKey);
                                const heightPercent =
                                    maxMonthlyRevenue > 0 ? Math.max((point.value / maxMonthlyRevenue) * 100, 4) : 4;

                                return (
                                    <button
                                        key={point.monthKey}
                                        type="button"
                                        onClick={() => setSelectedRevenueMonth(point.monthKey)}
                                        title={`${shortLabel}: ${formatEuro(point.value)}`}
                                        aria-label={`${shortLabel}: ${formatEuro(point.value)}`}
                                        className="flex h-full flex-1 cursor-pointer flex-col items-end justify-end"
                                    >
                                        <div
                                            className={cn(
                                                "w-full rounded-t-[4px] transition-colors",
                                                isSelected
                                                    ? "bg-primary"
                                                    : "bg-muted-foreground/25 hover:bg-muted-foreground/40"
                                            )}
                                            style={{ height: `${heightPercent}%` }}
                                        />
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex gap-1.5 text-[10px] uppercase text-muted-foreground">
                            {monthlyRevenueSeries.map((point) => (
                                <span
                                    key={point.monthKey}
                                    className={cn(
                                        "flex-1 text-center",
                                        point.monthKey === selectedRevenueMonth && "font-semibold text-primary"
                                    )}
                                >
                                    {getMonthShortLabel(point.monthKey)}
                                </span>
                            ))}
                        </div>
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