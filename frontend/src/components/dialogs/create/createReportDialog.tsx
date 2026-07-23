import CustomDialog from "@/components/dialogs/customDialog";
import CreateCustomerDialog from "@/components/dialogs/create/createCustomerDialog";
import CreateDeviceDialog from "@/components/dialogs/create/createDeviceDialog";
import CreateIssueDialog from "@/components/dialogs/create/createIssueDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createCustomer, createDevice, createIssue, getApiErrorMessage, listCustomers, listDevices, listIssues } from "@/lib/api";
import { startTransition, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import InputWithAdd from "@/components/inputWithAdd";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { ChangeEvent } from "react";

const formatCustomerOption = (
    firstName: string,
    lastName: string | null,
    phoneNumber: string | null,
    phoneNumberSecondary: string | null
) => {
    const fullName = `${firstName} ${lastName ?? ""}`.trim();
    return `${fullName} - ${phoneNumber?.trim() || phoneNumberSecondary?.trim() || "N/D"}`;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit?: (values: Record<string, string | boolean | number | null>) => Promise<void> | void;
};

const CreateReportDialog = ({ open, onOpenChange, onSubmit }: Props) => {
    const [formValues, setFormValues] = useState({
        customer: "",
        deviceType: "",
        issueDescription: "",
        password: "",
        charger: "unset",
        dataBackup: "unset",
        notes: "",
    });
    const [isCreateCustomerDialogOpen, setIsCreateCustomerDialogOpen] = useState(false);
    const [isCreateDeviceDialogOpen, setIsCreateDeviceDialogOpen] = useState(false);
    const [isCreateIssueDialogOpen, setIsCreateIssueDialogOpen] = useState(false);
    const [deviceOptions, setDeviceOptions] = useState<string[]>([]);
    const [issueOptions, setIssueOptions] = useState<string[]>([]);
    const [customerIdByOption, setCustomerIdByOption] = useState<Record<string, number>>({});
    const [deviceIdByOption, setDeviceIdByOption] = useState<Record<string, number>>({});
    const [issueIdByOption, setIssueIdByOption] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({
        issueDescription: false,
        charger: false,
        dataBackup: false,
    });

    useEffect(() => {
        if (open) {
            startTransition(() => {
                setFormValues({
                    customer: "",
                    deviceType: "",
                    issueDescription: "",
                    password: "",
                    charger: "unset",
                    dataBackup: "unset",
                    notes: "",
                });
                setFieldErrors({
                    issueDescription: false,
                    charger: false,
                    dataBackup: false,
                });
                setCustomerIdByOption({});
                setDeviceIdByOption({});
                setIssueIdByOption({});
            });

            const loadOptions = async () => {
                try {
                    const [devices, issues] = await Promise.all([
                        listDevices(),
                        listIssues(),
                    ]);

                    setDeviceOptions(devices.map((device) => device.name));
                    setDeviceIdByOption(Object.fromEntries(devices.map((device) => [device.name, device.id])));
                    setIssueOptions(issues.map((issue) => issue.description));
                    setIssueIdByOption(
                        Object.fromEntries(issues.map((issue) => [issue.description, issue.id]))
                    );
                } catch (error) {
                    toast.error(getApiErrorMessage(error, "Impossibile caricare i suggerimenti"));
                }
            };

            void loadOptions();
        }
    }, [open]);

    const searchCustomers = useCallback(async (query: string) => {
        const customers = await listCustomers({ pageSize: 8, search: query || undefined });
        const options = customers.items.map((customer) => ({
            id: customer.id,
            label: formatCustomerOption(
                customer.firstName,
                customer.lastName,
                customer.phoneNumber,
                customer.phoneNumberSecondary
            ),
        }));

        setCustomerIdByOption((prev) => ({
            ...prev,
            ...Object.fromEntries(options.map((item) => [item.label, item.id])),
        }));

        return options.map((item) => item.label);
    }, []);

    const handleConfirm = async () => {
        if (isSubmitting) {
            return;
        }

        const nextFieldErrors = {
            issueDescription: formValues.issueDescription.trim() === "",
            charger: formValues.charger === "unset",
            dataBackup: formValues.dataBackup === "unset",
        };

        setFieldErrors(nextFieldErrors);

        if (nextFieldErrors.issueDescription) {
            toast.error("La descrizione difetto e obbligatoria");
            return;
        }

        if (formValues.customer.trim() === "") {
            toast.error("Seleziona un cliente");
            return;
        }

        if (nextFieldErrors.charger) {
            toast.error("Seleziona se l'alimentatore è presente");
            return;
        }

        if (nextFieldErrors.dataBackup) {
            toast.error("Seleziona se deve essere effettuato il backup dati");
            return;
        }

        if (!onSubmit) {
            onOpenChange(false);
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit({
                ...formValues,
                customerId: customerIdByOption[formValues.customer] ?? null,
                deviceId: deviceIdByOption[formValues.deviceType] ?? null,
                issueId: issueIdByOption[formValues.issueDescription] ?? null,
                charger: formValues.charger === "yes",
                dataBackup: formValues.dataBackup === "yes",
            });
            onOpenChange(false);
            toast.success("Rapporto creato con successo");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile salvare i dati"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <CustomDialog
                open={open}
                onOpenChange={onOpenChange}
                title="Nuovo rapporto"
                description="Inserisci i dati del rapporto e conferma per salvare."
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

                            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-2">
                                <div className="grid lg:col-span-1">
                                    <Label htmlFor="client" className="text-lg">Cliente</Label>
                                    <div className="flex">
                                        <InputWithAdd
                                            id="client"
                                            placeholder="Cliente"
                                            inputClassName="rounded-r-none"
                                            value={formValues.customer}
                                            onSearch={searchCustomers}
                                            onChange={(value: string) => {
                                                setFormValues((prev) => ({ ...prev, customer: value }));
                                            }}
                                            required
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size={"icon-lg"}
                                            className="border-l-0! rounded-l-none"
                                            onClick={() => setIsCreateCustomerDialogOpen(true)}
                                        >
                                            <Plus className="size-5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid lg:col-span-2 xl:col-span-1">
                                    <Label htmlFor="deviceType" className="text-lg">Tipologia dispositivo</Label>
                                    <div className="flex">
                                        <InputWithAdd
                                            id="deviceType"
                                            placeholder="Es. iPhone 13"
                                            inputClassName="rounded-r-none"
                                            value={formValues.deviceType}
                                            options={deviceOptions}
                                            onCreate={async (value: string) => {
                                                const createdDevice = await createDevice({ name: value });
                                                setDeviceOptions((prev) => Array.from(new Set([...prev, value])));
                                                setDeviceIdByOption((prev) => ({ ...prev, [createdDevice.name]: createdDevice.id }));
                                            }}
                                            onChange={(value: string) => setFormValues((prev) => ({ ...prev, deviceType: value }))}
                                            required
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size={"icon-lg"}
                                            className="border-l-0! rounded-l-none"
                                            onClick={() => setIsCreateDeviceDialogOpen(true)}
                                        >
                                            <Plus className="size-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-3 rounded-md border border-primary/15 bg-muted/20 p-4">

                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Intervento</h3>

                            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-2">
                                <div className="grid lg:col-span-2 xl:col-span-1">
                                    <Label htmlFor="issueDescription" className="text-lg">Descrizione difetto</Label>
                                    <div className="flex">
                                        <InputWithAdd
                                            id="issueDescription"
                                            placeholder="Descrivi il difetto"
                                            inputClassName={`rounded-r-none ${fieldErrors.issueDescription ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
                                            value={formValues.issueDescription}
                                            options={issueOptions}
                                            onCreate={async (value: string) => {
                                                const createdIssue = await createIssue({ description: value });
                                                setIssueOptions((prev) => Array.from(new Set([...prev, value])));
                                                setIssueIdByOption((prev) => ({ ...prev, [createdIssue.description]: createdIssue.id }));
                                            }}
                                            onChange={(value: string) => {
                                                setFormValues((prev) => ({ ...prev, issueDescription: value }));
                                                if (fieldErrors.issueDescription) {
                                                    setFieldErrors((prev) => ({ ...prev, issueDescription: false }));
                                                }
                                            }}
                                            required
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size={"icon-lg"}
                                            className="border-l-0! rounded-l-none"
                                            onClick={() => setIsCreateIssueDialogOpen(true)}
                                        >
                                            <Plus className="size-5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid">
                                    <Label htmlFor="password" className="text-lg">Password sblocco</Label>
                                    <Input
                                        className="text-lg!"
                                        id="password"
                                        placeholder="Password dispositivo"
                                        value={formValues.password}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                            setFormValues((prev) => ({ ...prev, password: event.target.value }))
                                        }
                                    />
                                </div>

                                <div className="grid lg:col-span-2 xl:col-span-3">
                                    <Label htmlFor="notes" className="text-lg">Note</Label>
                                    <Textarea
                                        className="text-lg!"
                                        id="notes"
                                        placeholder="Note"
                                        rows={4}
                                        value={formValues.notes}
                                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                                            setFormValues((prev) => ({ ...prev, notes: event.target.value }))
                                        }
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-3 rounded-md border border-primary/15 bg-muted/20 p-4">

                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Stato</h3>

                            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-2">
                                <div className="grid gap-2 rounded-md">
                                    <Label htmlFor="charger" className="text-lg w-full">
                                        Alimentatore presente
                                    </Label>
                                    <Select
                                        value={formValues.charger}
                                        onValueChange={(value) => {
                                            setFormValues((prev) => ({ ...prev, charger: value }));
                                            if (fieldErrors.charger && value !== "unset") {
                                                setFieldErrors((prev) => ({ ...prev, charger: false }));
                                            }
                                        }}
                                    >
                                        <SelectTrigger
                                            id="charger"
                                            className={`w-full ${fieldErrors.charger ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
                                        >
                                            <SelectValue placeholder="Seleziona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unset">Seleziona</SelectItem>
                                            <SelectItem value="yes">Si</SelectItem>
                                            <SelectItem value="no">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2 rounded-md">
                                    <Label htmlFor="dataBackup" className="text-lg w-full">
                                        Backup dati
                                    </Label>
                                    <Select
                                        value={formValues.dataBackup}
                                        onValueChange={(value) => {
                                            setFormValues((prev) => ({ ...prev, dataBackup: value }));
                                            if (fieldErrors.dataBackup && value !== "unset") {
                                                setFieldErrors((prev) => ({ ...prev, dataBackup: false }));
                                            }
                                        }}
                                    >
                                        <SelectTrigger
                                            id="dataBackup"
                                            className={`w-full ${fieldErrors.dataBackup ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
                                        >
                                            <SelectValue placeholder="Seleziona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unset">Seleziona</SelectItem>
                                            <SelectItem value="yes">Si</SelectItem>
                                            <SelectItem value="no">No</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                    setCustomerIdByOption((prev) => ({
                        ...prev,
                        [customerOption]: createdCustomer.id,
                    }));
                    setFormValues((prev) => ({ ...prev, customer: customerOption }));
                }}
            />

            <CreateDeviceDialog
                open={isCreateDeviceDialogOpen}
                onOpenChange={setIsCreateDeviceDialogOpen}
                onSubmit={async (values) => {
                    const createdDevice = await createDevice({
                        name: String(values.name).trim(),
                    });

                    setDeviceOptions((prev) => Array.from(new Set([...prev, createdDevice.name])));
                    setDeviceIdByOption((prev) => ({ ...prev, [createdDevice.name]: createdDevice.id }));
                    setFormValues((prev) => ({ ...prev, deviceType: createdDevice.name }));
                }}
            />

            <CreateIssueDialog
                open={isCreateIssueDialogOpen}
                onOpenChange={setIsCreateIssueDialogOpen}
                onSubmit={async (values) => {
                    const createdIssue = await createIssue({
                        description: String(values.description).trim(),
                    });

                    setIssueOptions((prev) => Array.from(new Set([...prev, createdIssue.description])));
                    setIssueIdByOption((prev) => ({ ...prev, [createdIssue.description]: createdIssue.id }));
                    setFormValues((prev) => ({ ...prev, issueDescription: createdIssue.description }));
                }}
            />
        </>
    );
};

export default CreateReportDialog;
