import { CircleCheck, CircleDashed, Euro } from "lucide-react";
import CardDashboard from "./components/cardDashboard";
import CustomDialog from "@/components/dialogs/customDialog";
import PageHeader from "@/components/page-header";
import { useEffect, useState } from "react";
import CreateEntityButton from "@/components/create-entity-button";
import { getApiErrorMessage, listReports, listReportTechnicians } from "@/lib/api";
import { formatEuro } from "@/lib/utils";
import { toast } from "sonner";

const DashboardPage = () => {
    const [dialogCreateReportOpen, setDialogCreateReportOpen] = useState(false);
    const [openReports, setOpenReports] = useState(0);
    const [closedReports, setClosedReports] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);

    useEffect(() => {
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

            <CustomDialog
                open={dialogCreateReportOpen}
                onOpenChange={setDialogCreateReportOpen}
                title="Crea nuovo rapportino"
                content={
                    <div>
                        <p>Contenuto del dialog per creare un nuovo rapportino</p>
                    </div>
                }
            />
        </div>
    );
}

export default DashboardPage;