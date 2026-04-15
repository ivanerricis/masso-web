import LoadingPage from "@/components/loadingPage";
import { Button } from "@/components/ui/button";
import {
    getApiErrorMessage,
    getReport,
    getReportPrintUrl,
    listCollaborators,
    listCustomers,
    listDevices,
    listIssues,
    listReportTechnicians,
    listTechnicians,
    type ReportEntityDto,
} from "@/lib/api";
import { formatDateTime, formatEuro } from "@/lib/utils";
import { ArrowLeft, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

type ReportPageDetails = {
    report: ReportEntityDto;
    customerName: string;
    deviceName: string;
    issueName: string;
    collaboratorName: string;
    technicians: Array<{ id: number; name: string; price: number }>;
    techniciansTotal: number;
};

const yesNo = (value: boolean) => (value ? "Si" : "No");

const ReportPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const reportId = Number(id);
    const [isLoading, setIsLoading] = useState(true);
    const [details, setDetails] = useState<ReportPageDetails | null>(null);

    const hasValidReportId = useMemo(
        () => Number.isInteger(reportId) && reportId > 0,
        [reportId]
    );

    const handleBack = () => {
        navigate(-1);
    };

    const handlePrintReport = () => {
        if (!details) {
            return;
        }

        const printWindow = window.open(getReportPrintUrl(details.report.id), "_blank", "noopener,noreferrer");
        if (!printWindow) {
            toast.error("Popup bloccato dal browser. Consenti i popup per aprire la stampa.");
        }
    };

    useEffect(() => {
        if (!hasValidReportId) {
            toast.error("Report non valido");
            navigate("/reports");
            return;
        }

        const loadData = async () => {
            try {
                setIsLoading(true);
                const [report, customers, devices, issues, collaborators, reportTechnicians, technicians] = await Promise.all([
                    getReport(reportId),
                    listCustomers(),
                    listDevices(),
                    listIssues(),
                    listCollaborators(),
                    listReportTechnicians(),
                    listTechnicians(),
                ]);

                const customer = customers.find((item) => item.id === report.customerId);
                const device = devices.find((item) => item.id === report.deviceId);
                const issue = issues.find((item) => item.id === report.issueId);
                const collaborator = collaborators.find((item) => item.id === report.collaboratorId);

                const technicianById = new Map(technicians.map((technician) => [technician.id, technician]));
                const reportTechnicianRows = reportTechnicians.filter((item) => item.reportId === report.id);

                const technicianDetails = reportTechnicianRows.map((item) => {
                    const technician = technicianById.get(item.technicianId);
                    return {
                        id: item.technicianId,
                        name: technician
                            ? `${technician.firstName} ${technician.lastName ?? ""}`.trim()
                            : `Tecnico #${item.technicianId}`,
                        price: item.price,
                    };
                });

                const techniciansTotal = technicianDetails.reduce((total, item) => total + item.price, 0);

                setDetails({
                    report,
                    customerName: customer ? `${customer.firstName} ${customer.lastName ?? ""}`.trim() : "Cliente sconosciuto",
                    deviceName: device?.name ?? "Dispositivo sconosciuto",
                    issueName: issue?.description ?? "Difetto sconosciuto",
                    collaboratorName: collaborator
                        ? `${collaborator.firstName} ${collaborator.lastName ?? ""}`.trim()
                        : "-",
                    technicians: technicianDetails,
                    techniciansTotal,
                });
            } catch (error) {
                toast.error(getApiErrorMessage(error, "Impossibile caricare il report"));
                navigate("/reports");
            } finally {
                setIsLoading(false);
            }
        };

        void loadData();
    }, [hasValidReportId, navigate, reportId]);

    if (isLoading) {
        return <LoadingPage />;
    }

    if (!details) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                Report non disponibile.
            </div>
        );
    }

    const totalPrice = details.report.price + details.techniciansTotal;

    return (
        <div className="flex flex-col w-full h-full gap-4">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Button size={"icon-lg"} variant={"ghost"} onClick={handleBack}>
                        <ArrowLeft className="size-6" />
                    </Button>
                    <h1 className="text-2xl font-bold">Rapporto #{details.report.id}</h1>
                </div>

                <Button size={"lg"} onClick={handlePrintReport}>
                    <Printer className="size-5" />
                    Stampa
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-md border border-primary p-4">
                    <h2 className="text-lg font-semibold">Anagrafica</h2>
                    <div className="mt-3 space-y-2 text-base">
                        <p><span className="font-semibold">Cliente:</span> {details.customerName}</p>
                        <p><span className="font-semibold">Collaboratore:</span> {details.collaboratorName}</p>
                        <p><span className="font-semibold">Dispositivo:</span> {details.deviceName}</p>
                        <p><span className="font-semibold">Difetto:</span> {details.issueName}</p>
                    </div>
                </section>

                <section className="rounded-md border border-primary p-4">
                    <h2 className="text-lg font-semibold">Stato</h2>
                    <div className="mt-3 space-y-2 text-base">
                        <p><span className="font-semibold">Chiuso:</span> {yesNo(details.report.closed)}</p>
                        <p><span className="font-semibold">Da fatturare:</span> {yesNo(details.report.toInvoice)}</p>
                        <p><span className="font-semibold">Backup dati:</span> {yesNo(details.report.dataBackup)}</p>
                        <p><span className="font-semibold">Alimentatore:</span> {yesNo(details.report.charger)}</p>
                    </div>
                </section>

                <section className="rounded-md border border-primary p-4">
                    <h2 className="text-lg font-semibold">Dettagli Intervento</h2>
                    <div className="mt-3 space-y-2 text-base">
                        <p><span className="font-semibold">Descrizione problema:</span> {details.report.issueDescription ?? "-"}</p>
                        <p><span className="font-semibold">Descrizione servizio:</span> {details.report.serviceDescription ?? "-"}</p>
                        <p><span className="font-semibold">Password:</span> {details.report.password ?? "-"}</p>
                        <p><span className="font-semibold">Note:</span> {details.report.note ?? "-"}</p>
                    </div>
                </section>

                <section className="rounded-md border border-primary p-4">
                    <h2 className="text-lg font-semibold">Prezzi</h2>
                    <div className="mt-3 space-y-2 text-base">
                        <p><span className="font-semibold">Prezzo interno:</span> {formatEuro(details.report.price)}</p>
                        <p><span className="font-semibold">Prezzo tecnici:</span> {formatEuro(details.techniciansTotal)}</p>
                        <p><span className="font-semibold">Prezzo totale:</span> {formatEuro(totalPrice)}</p>
                    </div>
                </section>
            </div>

            <section className="rounded-md border border-primary p-4">
                <h2 className="text-lg font-semibold">Tecnici Associati</h2>
                {details.technicians.length === 0 ? (
                    <p className="mt-3 text-muted-foreground">Nessun tecnico associato a questo report.</p>
                ) : (
                    <div className="mt-3 space-y-2">
                        {details.technicians.map((technician) => (
                            <div key={technician.id} className="flex items-center justify-between rounded-md border p-3">
                                <span>{technician.name}</span>
                                <span className="font-semibold">{formatEuro(technician.price)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="rounded-md border border-primary p-4">
                <h2 className="text-lg font-semibold">Date</h2>
                <div className="mt-3 space-y-2 text-base">
                    <p><span className="font-semibold">Creato il:</span> {formatDateTime(details.report.created_at)}</p>
                    <p><span className="font-semibold">Ultimo aggiornamento:</span> {formatDateTime(details.report.updated_at)}</p>
                </div>
            </section>
        </div>
    );
};

export default ReportPage;