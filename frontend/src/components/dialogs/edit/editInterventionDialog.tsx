import CustomDialog from "@/components/dialogs/customDialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import DatePickerField from "@/components/date-picker-field";
import { getApiErrorMessage, getIntervention, listTechnicians } from "@/lib/api";
import {
    interventionDescriptionLabel,
    interventionStatusOptions,
    interventionTimeOptions,
    interventionTypeOptions,
    isOnSiteInterventionType,
} from "@/lib/interventions";
import type { InterventionStatus, InterventionType, TechnicianDto } from "@/types/dtos";
import { startTransition, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const withCurrentTimeOption = (value: string) =>
    value && !interventionTimeOptions.includes(value) ? [value, ...interventionTimeOptions] : interventionTimeOptions;

const formatPersonName = (firstName: string, lastName: string | null) => `${firstName} ${lastName ?? ""}`.trim();

export type EditInterventionSubmitValues = {
    interventionId: number;
    type: InterventionType;
    status: InterventionStatus;
    description: string;
    technicianId: number;
    interventionDate: string | null;
    startTime: string | null;
    endTime: string | null;
};

type EditInterventionDialogProps = {
    open: boolean;
    interventionId: number | null;
    customerName: string;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: EditInterventionSubmitValues) => Promise<void>;
};

const EditInterventionDialog = ({ open, interventionId, customerName, onOpenChange, onSubmit }: EditInterventionDialogProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadedInterventionId, setLoadedInterventionId] = useState<number | null>(null);
    const [technicians, setTechnicians] = useState<TechnicianDto[]>([]);

    const [formValues, setFormValues] = useState({
        type: "consegna_materiale" as InterventionType,
        status: "programmato" as InterventionStatus,
        description: "",
        technicianId: "",
        interventionDate: "",
        startTime: "",
        endTime: "",
    });

    const isOnSite = isOnSiteInterventionType(formValues.type);
    const startTimeOptions = useMemo(() => withCurrentTimeOption(formValues.startTime), [formValues.startTime]);
    const endTimeOptions = useMemo(() => withCurrentTimeOption(formValues.endTime), [formValues.endTime]);

    useEffect(() => {
        if (!open || !interventionId) {
            return;
        }

        startTransition(() => {
            setLoadedInterventionId(null);
        });

        const loadData = async () => {
            setIsLoading(true);
            try {
                const [intervention, techniciansData] = await Promise.all([
                    getIntervention(interventionId),
                    listTechnicians(),
                ]);

                setTechnicians(techniciansData);
                setFormValues({
                    type: intervention.type,
                    status: intervention.status,
                    description: intervention.description,
                    technicianId: String(intervention.technicianId),
                    interventionDate: intervention.interventionDate ?? "",
                    startTime: intervention.startTime?.slice(0, 5) ?? "",
                    endTime: intervention.endTime?.slice(0, 5) ?? "",
                });
                setLoadedInterventionId(intervention.id);
            } catch (error) {
                toast.error(getApiErrorMessage(error, "Impossibile caricare i dati dell'intervento"));
                onOpenChange(false);
            } finally {
                setIsLoading(false);
            }
        };

        startTransition(() => {
            void loadData();
        });
    }, [open, interventionId, onOpenChange]);

    const handleConfirm = async () => {
        if (!interventionId || isSubmitting || isLoading) {
            return;
        }

        const technicianId = Number(formValues.technicianId);

        if (!Number.isInteger(technicianId) || technicianId <= 0) {
            toast.error("Seleziona un tecnico valido");
            return;
        }

        if (formValues.description.trim() === "") {
            toast.error(
                formValues.type === "consegna_materiale"
                    ? "Indica i materiali da consegnare"
                    : "Indica il tipo di assistenza effettuata"
            );
            return;
        }

        if (isOnSite) {
            if (formValues.interventionDate.trim() === "") {
                toast.error("Seleziona la data dell'intervento");
                return;
            }

            if (formValues.startTime.trim() === "" || formValues.endTime.trim() === "") {
                toast.error("Indica l'ora di inizio e di fine assistenza");
                return;
            }

            if (formValues.startTime >= formValues.endTime) {
                toast.error("L'ora di fine deve essere successiva all'ora di inizio");
                return;
            }
        }

        try {
            setIsSubmitting(true);
            await onSubmit({
                interventionId,
                type: formValues.type,
                status: formValues.status,
                description: formValues.description.trim(),
                technicianId,
                interventionDate: isOnSite ? formValues.interventionDate : null,
                startTime: isOnSite ? formValues.startTime : null,
                endTime: isOnSite ? formValues.endTime : null,
            });

            toast.success("Intervento aggiornato con successo");
            onOpenChange(false);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile aggiornare l'intervento"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CustomDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Modifica intervento"
            contentClassName="sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl"
            preventOutsideClose
            confirmLabel={isSubmitting ? "Salvataggio..." : "Salva"}
            cancelLabel="Annulla"
            onCancel={() => onOpenChange(false)}
            onConfirm={() => void handleConfirm()}
            cancelDisabled={isSubmitting || isLoading}
            confirmDisabled={isSubmitting || isLoading}
            content={
                <div className="grid gap-4 py-4">
                    {isLoading || loadedInterventionId !== interventionId ? (
                        <div className="rounded-md border border-dashed border-primary/20 bg-muted/30 px-4 py-8 text-center text-muted-foreground">
                            Caricamento dati dell'intervento...
                        </div>
                    ) : (
                        <div className="grid max-h-[70vh] gap-2 overflow-y-auto pr-1">
                            <section className="grid gap-3 rounded-md border border-primary/15 bg-muted/20 p-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Anagrafica</h3>

                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="grid gap-1">
                                        <Label htmlFor="customerName" className="text-lg">Cliente</Label>
                                        <Select disabled value={customerName}>
                                            <SelectTrigger id="customerName" className="w-full">
                                                <SelectValue placeholder={customerName} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={customerName}>{customerName}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-1">
                                        <Label htmlFor="technicianId" className="text-lg">Tecnico</Label>
                                        <Select
                                            value={formValues.technicianId}
                                            onValueChange={(value) => setFormValues((prev) => ({ ...prev, technicianId: value }))}
                                        >
                                            <SelectTrigger id="technicianId" className="w-full">
                                                <SelectValue placeholder="Seleziona tecnico" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {technicians.map((technician) => (
                                                    <SelectItem key={technician.id} value={String(technician.id)}>
                                                        {formatPersonName(technician.firstName, technician.lastName)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </section>

                            <section className="grid gap-3 rounded-md border border-primary/15 bg-muted/20 p-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Intervento</h3>

                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="grid gap-1">
                                        <Label htmlFor="type" className="text-lg">Tipo intervento</Label>
                                        <Select
                                            value={formValues.type}
                                            onValueChange={(value) => setFormValues((prev) => ({ ...prev, type: value as InterventionType }))}
                                        >
                                            <SelectTrigger id="type" className="w-full">
                                                <SelectValue placeholder="Seleziona tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {interventionTypeOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-1">
                                        <Label htmlFor="status" className="text-lg">Stato</Label>
                                        <Select
                                            value={formValues.status}
                                            onValueChange={(value) => setFormValues((prev) => ({ ...prev, status: value as InterventionStatus }))}
                                        >
                                            <SelectTrigger id="status" className="w-full">
                                                <SelectValue placeholder="Seleziona stato" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {interventionStatusOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {isOnSite ? (
                                        <>
                                            <div className="grid gap-1">
                                                <Label htmlFor="interventionDate" className="text-lg">Data intervento</Label>
                                                <DatePickerField
                                                    id="interventionDate"
                                                    value={formValues.interventionDate}
                                                    onValueChange={(value) => setFormValues((prev) => ({ ...prev, interventionDate: value }))}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-1">
                                                    <Label htmlFor="startTime" className="text-lg">Ora inizio</Label>
                                                    <Select
                                                        value={formValues.startTime}
                                                        onValueChange={(value) => setFormValues((prev) => ({ ...prev, startTime: value }))}
                                                    >
                                                        <SelectTrigger id="startTime" className="w-full">
                                                            <SelectValue placeholder="Seleziona ora" />
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-64">
                                                            {startTimeOptions.map((time) => (
                                                                <SelectItem key={time} value={time}>
                                                                    {time}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid gap-1">
                                                    <Label htmlFor="endTime" className="text-lg">Ora fine</Label>
                                                    <Select
                                                        value={formValues.endTime}
                                                        onValueChange={(value) => setFormValues((prev) => ({ ...prev, endTime: value }))}
                                                    >
                                                        <SelectTrigger id="endTime" className="w-full">
                                                            <SelectValue placeholder="Seleziona ora" />
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-64">
                                                            {endTimeOptions.map((time) => (
                                                                <SelectItem key={time} value={time}>
                                                                    {time}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </>
                                    ) : null}

                                    <div className="grid gap-1 lg:col-span-2">
                                        <Label htmlFor="description" className="text-lg">{interventionDescriptionLabel(formValues.type)}</Label>
                                        <Textarea
                                            id="description"
                                            className="text-lg! resize-none"
                                            rows={4}
                                            value={formValues.description}
                                            onChange={(event) => setFormValues((prev) => ({ ...prev, description: event.target.value }))}
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            }
        />
    );
};

export default EditInterventionDialog;
