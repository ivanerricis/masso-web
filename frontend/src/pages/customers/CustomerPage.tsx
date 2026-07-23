import CardReport from "@/components/cardReport";
import LoadingPage from "@/components/loadingPage";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import TablePagination from "@/components/table-pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiErrorMessage, listCustomers, listDevices, listReports } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { ReportVisibilityFilter } from "../reports/components/types";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useTablePagination } from "@/hooks/useTablePagination";

type CustomerReportCard = {
    id: number;
    title: string;
    deviceName: string;
    closed: boolean;
};

const CustomerPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const customerId = Number(id);
    const [isLoading, setIsLoading] = useState(true);
    const [customerName, setCustomerName] = useState("Cliente");
    const [reportCards, setReportCards] = useState<CustomerReportCard[]>([]);
    const [visibilityFilter, setVisibilityFilter] = useState<ReportVisibilityFilter>("all");

    const hasValidCustomerId = useMemo(
        () => Number.isInteger(customerId) && customerId > 0,
        [customerId]
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

    const pageSize = 10;
    const { currentPage, setCurrentPage } = useTablePagination({
        resetDependencies: [visibilityFilter],
    });
    const totalItems = visibleReportCards.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const paginatedReportCards = visibleReportCards.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    useEffect(() => {
        if (!hasValidCustomerId) {
            toast.error("Cliente non valido");
            navigate("/clients");
            return;
        }

        const loadData = async () => {
            try {
                setIsLoading(true);
                const [reports, customers, devices] = await Promise.all([
                    listReports(),
                    listCustomers(),
                    listDevices(),
                ]);

                const customer = customers.find((item) => item.id === customerId);
                if (customer) {
                    setCustomerName(`${customer.firstName} ${customer.lastName ?? ""}`.trim());
                }

                const deviceById = new Map(devices.map((device) => [device.id, device]));

                const cards = reports
                    .filter((report) => report.customerId === customerId)
                    .map((report) => {
                        const device = deviceById.get(report.deviceId);

                        return {
                            id: report.id,
                            title: `Rapporto #${report.id}`,
                            deviceName: device?.name ?? "Dispositivo sconosciuto",
                            closed: report.closed,
                        };
                    });

                setReportCards(cards);
            } catch (error) {
                toast.error(getApiErrorMessage(error, "Impossibile caricare i report del cliente"));
            } finally {
                setIsLoading(false);
            }
        };

        void loadData();
    }, [customerId, hasValidCustomerId, navigate]);

    if (isLoading) {
        return <LoadingPage />;
    }

    return (
        <div className="flex flex-col w-full h-full gap-4">
            <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon-lg" variant="ghost" onClick={handleBack} aria-label="Torna indietro">
                            <ArrowLeft className="size-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Torna indietro</TooltipContent>
                </Tooltip>
                <h1 className="text-2xl font-bold">{customerName}</h1>
            </div>

            <p className="ml-12">Rapporti del cliente</p>
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
            <div className="ml-12 flex flex-col gap-4">
                {visibleReportCards.length === 0 ? (
                    <p className="text-muted-foreground">Nessun report associato a questo cliente.</p>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-6">
                            {paginatedReportCards.map((report) => (
                                <CardReport
                                    key={report.id}
                                    customerName={report.title}
                                    isClosed={report.closed}
                                    deviceName={report.deviceName}
                                    onOpen={() => navigate(`/reports/${report.id}`)}
                                />
                            ))}
                        </div>
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default CustomerPage;
