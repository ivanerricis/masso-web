import { CircleCheck, CircleDashed, Euro } from "lucide-react";
import CardDashboard from "./components/cardDashboard";
import CreateReportDialog from "@/components/dialogs/create/createReportDialog";
import PageHeader from "@/components/page-header";
import { useEffect, useState } from "react";
import CreateEntityButton from "@/components/create-entity-button";
import {
    createReport,
    getApiErrorMessage,
    listCustomers,
    listDevices,
    listIssues,
    listReports,
    listReportTechnicians,
} from "@/lib/api";
import { formatEuro } from "@/lib/utils";
import { toast } from "sonner";

const DashboardPage = () => {
    const [dialogCreateReportOpen, setDialogCreateReportOpen] = useState(false);
    const [openReports, setOpenReports] = useState(0);
    const [closedReports, setClosedReports] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const loadDashboardMetrics = async () => {
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
        }
    };

    const formatCustomerOption = (firstName: string, lastName: string | null, phoneNumber: string | null) => {
        const fullName = `${firstName} ${lastName ?? ""}`.trim();
        return `${fullName} - ${phoneNumber?.trim() || "N/D"}`;
    };

    const handleCreateReport = async (values: Record<string, string | boolean>) => {
        const [customers, devices, issues] = await Promise.all([
            listCustomers(),
            listDevices(),
            listIssues(),
        ]);

        const selectedCustomer = customers.find(
            (customer) =>
                formatCustomerOption(customer.firstName, customer.lastName, customer.phoneNumber) ===
                String(values.customer)
        );

        const selectedDevice = devices.find(
            (device) => device.name.toLowerCase() === String(values.deviceType).trim().toLowerCase()
        );

        const selectedIssue = issues.find(
            (issue) => issue.description.toLowerCase() === String(values.issueDescription).trim().toLowerCase()
        );

        if (!selectedCustomer) {
            throw new Error("Seleziona un cliente esistente o creane uno nuovo.");
        }

        if (!selectedDevice) {
            throw new Error("Seleziona una tipologia dispositivo esistente o creane una nuova.");
        }

        if (!selectedIssue) {
            throw new Error("Seleziona un difetto esistente o creane uno nuovo.");
        }

        await createReport({
            deviceId: selectedDevice.id,
            issueId: selectedIssue.id,
            customerId: selectedCustomer.id,
            note: String(values.notes).trim() === "" ? null : String(values.notes).trim(),
            password: String(values.password).trim() === "" ? null : String(values.password).trim(),
            issueDescription:
                String(values.issueDescription).trim() === "" ? null : String(values.issueDescription).trim(),
            dataBackup: Boolean(values.dataBackup),
            charger: Boolean(values.charger),
        });

        await loadDashboardMetrics();
    };

    useEffect(() => {
        void loadDashboardMetrics();
    }, []);

    return (
        <div className="flex flex-col gap-4">
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
                />
                <CardDashboard
                    text="Rapportini chiusi"
                    icon={CircleCheck}
                    number={String(closedReports)}
                    iconColor="text-green-400"
                />
                <CardDashboard
                    text="Incassi totali"
                    icon={Euro}
                    number={formatEuro(totalRevenue)}
                    iconColor="text-yellow-400"
                />
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