import { CircleCheck, CircleDashed, Euro } from "lucide-react";
import CardDashboard from "./components/cardDashboard";
import CreateReportDialog from "@/components/dialogs/create/createReportDialog";
import PageHeader from "@/components/page-header";
import { useEffect, useState } from "react";
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
    listReportTechnicians,
} from "@/lib/api";
import { formatEuro } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
    const navigate = useNavigate();
    const [dialogCreateReportOpen, setDialogCreateReportOpen] = useState(false);
    const [openReports, setOpenReports] = useState(0);
    const [closedReports, setClosedReports] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const loadDashboardMetrics = async () => {
        setIsLoading(true);
        try {
            const [reports, reportTechnicians] = await Promise.all([
                listReports(),
                listReportTechnicians(),
            ]);

            const techniciansPriceByReportId = new Map<number, number>();
            for (const item of reportTechnicians) {
                techniciansPriceByReportId.set(
                    item.reportId,
                    (techniciansPriceByReportId.get(item.reportId) ?? 0) + item.price
                );
            }

            const openCount = reports.filter((report) => !report.closed).length;
            const closedCount = reports.filter((report) => report.closed).length;
            const revenue = reports
                .filter((report) => report.closed)
                .reduce(
                    (acc, report) => acc + report.price + (techniciansPriceByReportId.get(report.id) ?? 0),
                    0
                );

            setOpenReports(openCount);
            setClosedReports(closedCount);
            setTotalRevenue(revenue);
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
        <div className="flex flex-col gap-4 w-full">
            <PageHeader
                title="Dashboard"
                description="Panoramica del laboratorio e stato delle riparazioni."
                action={
                    <CreateEntityButton label="Nuovo rapportino" onClick={() => setDialogCreateReportOpen(true)} />
                }
            />

            <div className="flex flex-wrap gap-4">
                {isLoading && openReports === 0 && closedReports === 0 && totalRevenue === 0 ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <div key={`dashboard-skeleton-${index}`} className="flex w-58 flex-col gap-2 rounded-lg border bg-card p-6 shadow">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-30" />
                                <Skeleton className="size-6 rounded-full" />
                            </div>
                            <Skeleton className="mt-1 h-8 w-24" />
                        </div>
                    ))
                ) : (
                    <>
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
                        <CardDashboard
                            text="Incassi totali"
                            icon={Euro}
                            number={formatEuro(totalRevenue)}
                            iconColor="text-yellow-400"
                        />
                    </>
                )}
            </div>

            <CreateReportDialog
                open={dialogCreateReportOpen}
                onOpenChange={setDialogCreateReportOpen}
                onSubmit={handleCreateReport}
            />
        </div>
    );
}

export default DashboardPage;