import CustomDialog from "@/components/dialogs/customDialog";
import CreateCustomerDialog from "@/components/dialogs/create/createCustomerDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import InputWithAdd from "@/components/inputWithAdd";
import { createCustomer, getApiErrorMessage, listCustomers, listTechnicians } from "@/lib/api";
import { interventionDescriptionLabel, interventionStatusOptions, interventionTypeOptions, isOnSiteInterventionType } from "@/lib/interventions";
import type { InterventionStatus, InterventionType, TechnicianDto } from "@/types/dtos";
import { Plus } from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import { toast } from "sonner";

const formatCustomerOption = (
    firstName: string,
    lastName: string | null,
    phoneNumber: string | null,
    phoneNumberSecondary: string | null
) => {
    const fullName = `${firstName} ${lastName ?? ""}`.trim();
    return `${fullName} - ${phoneNumber?.trim() || phoneNumberSecondary?.trim() || "N/D"}`;
};

const formatPersonName = (firstName: string, lastName: string | null) => `${firstName} ${lastName ?? ""}`.trim();

export type CreateInterventionSubmitValues = {
    type: InterventionType;
    status: InterventionStatus;
    description: string;
    customer: string;
    customerId: number | null;
    technicianId: number;
    interventionDate: string | null;
    startTime: string | null;
    endTime: string | null;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit?: (values: CreateInterventionSubmitValues) => Promise<void> | void;
};

const CreateInterventionDialog = ({ open, onOpenChange, onSubmit }: Props) => {
    const [formValues, setFormValues] = useState({
        type: "consegna_materiale" as InterventionType,
        status: "programmato" as InterventionStatus,
        description: "",
        customer: "",
        technicianId: "",
        interventionDate: "",
        startTime: "",
        endTime: "",
    });
    const [technicians, setTechnicians] = useState<TechnicianDto[]>([]);
    const [customerIdByOption, setCustomerIdByOption] = useState<Record<string, number>>({});
    const [isCreateCustomerDialogOpen, setIsCreateCustomerDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isOnSite = isOnSiteInterventionType(formValues.type);

    useEffect(() => {
        if (!open) {
            return;
        }

        startTransition(() => {
            setFormValues({
                type: "consegna_materiale",
                status: "programmato",
                description: "",
                customer: "",
                technicianId: "",
                interventionDate: "",
                startTime: "",
                endTime: "",
            });
            setCustomerIdByOption({});
        });

        const loadTechnicians = async () => {
            try {
                const techniciansData = await listTechnicians();
                setTechnicians(techniciansData);
            } catch (error) {
                toast.error(getApiErrorMessage(error, "Impossibile caricare i tecnici"));
            }
        };

        void loadTechnicians();
    }, [open]);

    const searchCustomers = async (query: string) => {
        const customers = await listCustomers({ pageSize: 8, search: query || undefined });
        const options = customers.items.map((customer) => ({
            id: customer.id,
            label: formatCustomerOption(customer.firstName, customer.lastName, customer.phoneNumber, customer.phoneNumberSecondary),
        }));

        setCustomerIdByOption((prev) => ({
            ...prev,
            ...Object.fromEntries(options.map((item) => [item.label, item.id])),
        }));

        return options.map((item) => item.label);
    };

    const handleConfirm = async () => {
        if (isSubmitting) {
            return;
        }

        if (formValues.customer.trim() === "") {
            toast.error("Seleziona un cliente");
            return;
        }

        if (formValues.technicianId === "") {
            toast.error("Seleziona un tecnico");
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

        if (!onSubmit) {
            onOpenChange(false);
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit({
                type: formValues.type,
                status: formValues.status,
                description: formValues.description.trim(),
                customer: formValues.customer,
                customerId: customerIdByOption[formValues.customer] ?? null,
                technicianId: Number(formValues.technicianId),
                interventionDate: isOnSite ? formValues.interventionDate : null,
                startTime: isOnSite ? formValues.startTime : null,
                endTime: isOnSite ? formValues.endTime : null,
            });
            onOpenChange(false);
            toast.success("Intervento creato con successo");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile salvare l'intervento"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <CustomDialog
                open={open}
                onOpenChange={onOpenChange}
                title="Nuovo intervento"
                description="Inserisci i dati dell'intervento e conferma per salvare."
                contentClassName="sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl"
                preventOutsideClose
                confirmLabel={isSubmitting ? "Salvataggio..." : "Salva"}
                cancelLabel="Annulla"
                onCancel={() => onOpenChange(false)}
                onConfirm={() => void handleConfirm()}
                cancelDisabled={isSubmitting}
                confirmDisabled={isSubmitting}
                content={
                    <div className="grid max-h-[72vh] gap-4 overflow-y-auto py-1 pr-1">
                        <section className="grid gap-3 rounded-md border border-primary/15 bg-muted/20 p-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Anagrafica</h3>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="grid">
                                    <Label htmlFor="customer" className="text-lg">Cliente</Label>
                                    <div className="flex">
                                        <InputWithAdd
                                            id="customer"
                                            placeholder="Cliente"
                                            inputClassName="rounded-r-none"
                                            value={formValues.customer}
                                            onSearch={searchCustomers}
                                            onChange={(value) => setFormValues((prev) => ({ ...prev, customer: value }))}
                                            required
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon-lg"
                                            className="border-l-0! rounded-l-none"
                                            onClick={() => setIsCreateCustomerDialogOpen(true)}
                                        >
                                            <Plus className="size-5" />
                                        </Button>
                                    </div>
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
                                            <Input
                                                id="interventionDate"
                                                type="date"
                                                className="text-lg!"
                                                value={formValues.interventionDate}
                                                onChange={(event) => setFormValues((prev) => ({ ...prev, interventionDate: event.target.value }))}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-1">
                                                <Label htmlFor="startTime" className="text-lg">Ora inizio</Label>
                                                <Input
                                                    id="startTime"
                                                    type="time"
                                                    className="text-lg!"
                                                    value={formValues.startTime}
                                                    onChange={(event) => setFormValues((prev) => ({ ...prev, startTime: event.target.value }))}
                                                />
                                            </div>

                                            <div className="grid gap-1">
                                                <Label htmlFor="endTime" className="text-lg">Ora fine</Label>
                                                <Input
                                                    id="endTime"
                                                    type="time"
                                                    className="text-lg!"
                                                    value={formValues.endTime}
                                                    onChange={(event) => setFormValues((prev) => ({ ...prev, endTime: event.target.value }))}
                                                />
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
                                        placeholder={
                                            formValues.type === "consegna_materiale"
                                                ? "Elenca i materiali da consegnare"
                                                : "Descrivi l'assistenza effettuata"
                                        }
                                        value={formValues.description}
                                        onChange={(event) => setFormValues((prev) => ({ ...prev, description: event.target.value }))}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                }
            />

            <CreateCustomerDialog
                open={isCreateCustomerDialogOpen}
                onOpenChange={setIsCreateCustomerDialogOpen}
                onSubmit={async (values) => {
                    const createdCustomer = await createCustomer({
                        firstName: String(values.firstName).trim(),
                        lastName: String(values.lastName).trim() === "" ? null : String(values.lastName).trim(),
                        phoneNumber: String(values.phoneNumber).trim() === "" ? null : String(values.phoneNumber).trim(),
                        phoneNumberSecondary:
                            String(values.phoneNumberSecondary).trim() === "" ? null : String(values.phoneNumberSecondary).trim(),
                        email: String(values.email).trim() === "" ? null : String(values.email).trim(),
                    });

                    const customerOption = formatCustomerOption(
                        createdCustomer.firstName,
                        createdCustomer.lastName,
                        createdCustomer.phoneNumber,
                        createdCustomer.phoneNumberSecondary
                    );
                    setCustomerIdByOption((prev) => ({ ...prev, [customerOption]: createdCustomer.id }));
                    setFormValues((prev) => ({ ...prev, customer: customerOption }));
                }}
            />
        </>
    );
};

export default CreateInterventionDialog;
