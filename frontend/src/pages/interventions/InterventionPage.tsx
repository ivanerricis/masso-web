import LoadingPage from "@/components/loadingPage";
import EditInterventionDialog, { type EditInterventionSubmitValues } from "@/components/dialogs/edit/editInterventionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    getApiErrorMessage,
    getIntervention,
    getInterventionPrintUrl,
    listCustomers,
    listTechnicians,
    type InterventionEntityDto,
    updateIntervention,
} from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";
import { formatInterventionStatus, formatInterventionTime, formatInterventionType, isOnSiteInterventionType } from "@/lib/interventions";
import { ArrowLeft, Pencil, Printer } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

type InterventionPageDetails = {
    intervention: InterventionEntityDto;
    customerName: string;
    customerPhone: string | null;
    technicianName: string;
};

const statusBadgeClass = (status: InterventionEntityDto["status"]) => {
    if (status === "completato") {
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    }

    if (status === "in_lavorazione") {
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
    }

    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-medium wrap-break-word">{value}</p>
    </div>
);

const InterventionPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const interventionId = Number(id);
    const [isLoading, setIsLoading] = useState(true);
    const [details, setDetails] = useState<InterventionPageDetails | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const hasValidInterventionId = useMemo(() => Number.isInteger(interventionId) && interventionId > 0, [interventionId]);

    const handleBack = () => {
        navigate(-1);
    };

    const handlePrintIntervention = () => {
        if (!details) {
            return;
        }

        const printWindow = window.open(getInterventionPrintUrl(details.intervention.id), "_blank", "noopener,noreferrer");
        if (!printWindow) {
            toast.error("Popup bloccato dal browser. Consenti i popup per aprire la stampa.");
        }
    };

    const loadDetails = useCallback(async () => {
        const [intervention, customers, technicians] = await Promise.all([
            getIntervention(interventionId),
            listCustomers(),
            listTechnicians(),
        ]);

        const customer = customers.find((item) => item.id === intervention.customerId);
        const technician = technicians.find((item) => item.id === intervention.technicianId);

        setDetails({
            intervention,
            customerName: customer ? `${customer.firstName} ${customer.lastName ?? ""}`.trim() : "Cliente sconosciuto",
            customerPhone: customer?.phoneNumber ?? customer?.phoneNumberSecondary ?? null,
            technicianName: technician ? `${technician.firstName} ${technician.lastName ?? ""}`.trim() : "Tecnico sconosciuto",
        });
    }, [interventionId]);

    const handleEditIntervention = async (values: EditInterventionSubmitValues) => {
        await updateIntervention(values.interventionId, {
            type: values.type,
            status: values.status,
            description: values.description,
            technicianId: values.technicianId,
            interventionDate: values.interventionDate,
            startTime: values.startTime,
            endTime: values.endTime,
        });

        await loadDetails();
    };

    useEffect(() => {
        if (!hasValidInterventionId) {
            toast.error("Intervento non valido");
            navigate("/interventions");
            return;
        }

        const loadData = async () => {
            try {
                setIsLoading(true);
                await loadDetails();
            } catch (error) {
                toast.error(getApiErrorMessage(error, "Impossibile caricare l'intervento"));
                navigate("/interventions");
            } finally {
                setIsLoading(false);
            }
        };

        void loadData();
    }, [hasValidInterventionId, navigate, loadDetails]);

    if (isLoading) {
        return <LoadingPage />;
    }

    if (!details) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                Intervento non disponibile.
            </div>
        );
    }

    const isOnSite = isOnSiteInterventionType(details.intervention.type);

    return (
        <div className="flex w-full flex-col gap-4 overflow-auto p-2">
            <div className="border-primary/30">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                            <Button size="icon-lg" variant="ghost" onClick={handleBack} className="shrink-0">
                                <ArrowLeft className="size-6" />
                            </Button>

                            <div className="min-w-0">
                                <h1 className="text-xl font-bold tracking-tight sm:text-2xl wrap-break-word">
                                    Intervento #{details.intervention.id} - {details.customerName}
                                </h1>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 self-end lg:self-auto">
                            <Button variant="outline" size="lg" onClick={() => setIsEditDialogOpen(true)}>
                                <Pencil className="size-5" />
                                <span className="hidden lg:inline text-lg">Modifica</span>
                            </Button>

                            <Button size="lg" onClick={handlePrintIntervention}>
                                <Printer className="size-5" />
                                <span className="hidden lg:inline text-lg">Stampa</span>
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full border border-border/70 bg-background px-3 py-2">
                            Creato: {formatDateTime(details.intervention.created_at)}
                        </span>
                        <span className="rounded-full border border-border/70 bg-background px-3 py-2">
                            Aggiornato: {details.intervention.updated_at ? formatDateTime(details.intervention.updated_at) : "-"}
                        </span>
                        <span className={`rounded-full px-3 py-2 font-medium ${statusBadgeClass(details.intervention.status)}`}>
                            {formatInterventionStatus(details.intervention.status)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="border-primary/20 h-fit! gap-2!">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-primary">Tipo intervento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{formatInterventionType(details.intervention.type)}</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 h-fit! gap-2!">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-primary">Data intervento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">
                            {isOnSite ? formatDate(details.intervention.interventionDate) : "-"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 h-fit! gap-2!">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-primary">Ora inizio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">
                            {isOnSite ? formatInterventionTime(details.intervention.startTime) : "-"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 h-fit! gap-2!">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-primary">Ora fine</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">
                            {isOnSite ? formatInterventionTime(details.intervention.endTime) : "-"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <Card className="gap-1">
                    <CardHeader>
                        <CardTitle className="text-primary">Anagrafica</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 sm:grid-cols-2">
                        <DetailItem label="Cliente" value={details.customerName} />
                        <DetailItem label="Telefono" value={details.customerPhone ?? "-"} />
                        <DetailItem label="Tecnico" value={details.technicianName} />
                        <DetailItem label="Stato" value={formatInterventionStatus(details.intervention.status)} />
                    </CardContent>
                </Card>

                <Card className="gap-1">
                    <CardHeader>
                        <CardTitle className="text-primary">Dettagli</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <DetailItem label="Descrizione" value={details.intervention.description} />
                        <DetailItem label="Creato il" value={formatDateTime(details.intervention.created_at)} />
                        <DetailItem
                            label="Ultimo aggiornamento"
                            value={details.intervention.updated_at ? formatDateTime(details.intervention.updated_at) : "-"}
                        />
                    </CardContent>
                </Card>
            </div>

            <EditInterventionDialog
                open={isEditDialogOpen}
                interventionId={details.intervention.id}
                customerName={details.customerName}
                onOpenChange={setIsEditDialogOpen}
                onSubmit={handleEditIntervention}
            />
        </div>
    );
};

export default InterventionPage;
