import CardReport from "@/components/cardReport";
import LoadingPage from "@/components/loadingPage";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiErrorMessage, listCollaborators, listCustomers, listDevices, listReports } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { ReportVisibilityFilter } from "../reports/components/types";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

type CollaboratorReportCard = {
    id: number;
    customerName: string;
    deviceName: string;
    closed: boolean;
};

const CollaboratorPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const collaboratorId = Number(id);
    const [isLoading, setIsLoading] = useState(true);
    const [collaboratorName, setCollaboratorName] = useState("Collaboratore");
    const [reportCards, setReportCards] = useState<CollaboratorReportCard[]>([]);
    const [visibilityFilter, setVisibilityFilter] = useState<ReportVisibilityFilter>("all");

    const hasValidCollaboratorId = useMemo(
        () => Number.isInteger(collaboratorId) && collaboratorId > 0,
        [collaboratorId]
    );

    const handleBack = () => {
        navigate(-1);
    };

    const visibleReportCards = useMemo(() => {
        if (visibilityFilter === "open") {
            return reportCards.filter((report) => !report.closed);
        }

        if (visibilityFilter === "closed") {
            return reportCards.filter((report) => report.closed);
        }

        return reportCards;
    }, [reportCards, visibilityFilter]);

    useEffect(() => {
        if (!hasValidCollaboratorId) {
            toast.error("Collaboratore non valido");
            navigate("/collaborators");
            return;
        }

        const loadData = async () => {
            try {
                setIsLoading(true);
                const [reports, collaborators, customers, devices] = await Promise.all([
                    listReports(),
                    listCollaborators(),
                    listCustomers(),
                    listDevices(),
                ]);

                const collaborator = collaborators.find((item) => item.id === collaboratorId);
                if (collaborator) {
                    setCollaboratorName(`${collaborator.firstName} ${collaborator.lastName ?? ""}`.trim());
                }

                const customerById = new Map(customers.map((customer) => [customer.id, customer]));
                const deviceById = new Map(devices.map((device) => [device.id, device]));

                const cards = reports
                    .filter((report) => report.collaboratorId === collaboratorId)
                    .map((report) => {
                        const customer = customerById.get(report.customerId);
                        const device = deviceById.get(report.deviceId);

                        return {
                            id: report.id,
                            customerName:
                                customer ? `${customer.firstName} ${customer.lastName ?? ""}`.trim() : "Cliente sconosciuto",
                            deviceName: device?.name ?? "Dispositivo sconosciuto",
                            closed: report.closed,
                        };
                    });

                setReportCards(cards);
            } catch (error) {
                toast.error(getApiErrorMessage(error, "Impossibile caricare i report del collaboratore"));
            } finally {
                setIsLoading(false);
            }
        };

        void loadData();
    }, [collaboratorId, hasValidCollaboratorId, navigate]);

    if (isLoading) {
        return <LoadingPage />;
    }

    return (
        <div className="flex flex-col w-full h-full gap-4">
            <div className="flex items-center gap-2">
                <Button size="icon-lg" variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="size-6" />
                </Button>
                <h1 className="text-2xl font-bold">{collaboratorName}</h1>
            </div>
            <p className="ml-12">Rapporti del collaboratore</p>
            <div className="ml-12">
                <Select value={visibilityFilter} onValueChange={(value) => setVisibilityFilter(value as ReportVisibilityFilter)}>
                    <SelectTrigger className="w-full sm:w-56">
                        <SelectValue placeholder="Filtra per stato" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        <SelectItem value="all">Tutti i rapportini</SelectItem>
                        <SelectItem value="open">Rapportini aperti</SelectItem>
                        <SelectItem value="closed">Rapportini chiusi</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="ml-12 flex flex-wrap gap-6">
                {visibleReportCards.length === 0 ? (
                    <p className="text-muted-foreground">Nessun report associato a questo collaboratore.</p>
                ) : (
                    visibleReportCards.map((report) => (
                        <CardReport
                            key={report.id}
                            customerName={report.customerName}
                            isClosed={report.closed}
                            deviceName={report.deviceName}
                            onOpen={() => navigate(`/reports/${report.id}`)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default CollaboratorPage;
