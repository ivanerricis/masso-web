import CustomDialog from "@/components/dialogs/customDialog";
import CreateCustomerDialog from "@/components/dialogs/create/createCustomerDialog";
import CreateDeviceDialog from "@/components/dialogs/create/createDeviceDialog";
import CreateIssueDialog from "@/components/dialogs/create/createIssueDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createCustomer, createDevice, createIssue, getApiErrorMessage, listCustomers, listDevices, listIssues } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import InputWithAdd from "@/components/inputWithAdd";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import type { ChangeEvent } from "react";

const formatCustomerOption = (firstName: string, lastName: string | null, phoneNumber: string | null) => {
    const fullName = `${firstName} ${lastName ?? ""}`.trim();
    return `${fullName} - ${phoneNumber?.trim() || "N/D"}`;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit?: (values: Record<string, string | boolean>) => Promise<void> | void;
};

const CreateReportDialog = ({ open, onOpenChange, onSubmit }: Props) => {
    const [formValues, setFormValues] = useState({
        customer: "",
        deviceType: "",
        issueDescription: "",
        saveIssueInCatalog: false,
        password: "",
        charger: false,
        dataBackup: false,
        notes: "",
    });
    const [isCreateCustomerDialogOpen, setIsCreateCustomerDialogOpen] = useState(false);
    const [isCreateDeviceDialogOpen, setIsCreateDeviceDialogOpen] = useState(false);
    const [isCreateIssueDialogOpen, setIsCreateIssueDialogOpen] = useState(false);
    const [customerOptions, setCustomerOptions] = useState<string[]>([]);
    const [deviceOptions, setDeviceOptions] = useState<string[]>([]);
    const [issueOptions, setIssueOptions] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setFormValues({
                customer: "",
                deviceType: "",
                issueDescription: "",
                saveIssueInCatalog: false,
                password: "",
                charger: false,
                dataBackup: false,
                notes: "",
            });

            const loadOptions = async () => {
                try {
                    const [customers, devices, issues] = await Promise.all([
                        listCustomers(),
                        listDevices(),
                        listIssues(),
                    ]);

                    setCustomerOptions(
                        customers.map((customer) => formatCustomerOption(customer.firstName, customer.lastName, customer.phoneNumber))
                    );
                    setDeviceOptions(devices.map((device) => device.name));
                    setIssueOptions(issues.map((issue) => issue.description));
                } catch (error) {
                    toast.error(getApiErrorMessage(error, "Impossibile caricare i suggerimenti"));
                }
            };

            void loadOptions();
        }
    }, [open]);

    const handleConfirm = async () => {
        if (isSubmitting) {
            return;
        }

        if (formValues.issueDescription.trim() === "") {
            toast.error("La descrizione difetto e obbligatoria");
            return;
        }

        if (!onSubmit) {
            onOpenChange(false);
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit(formValues);
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
                confirmLabel={isSubmitting ? "Salvataggio..." : "Salva"}
                cancelLabel="Annulla"
                onCancel={() => onOpenChange(false)}
                onConfirm={() => void handleConfirm()}
                cancelDisabled={isSubmitting}
                confirmDisabled={isSubmitting}
                content={
                    <div className="grid gap-6">
                        <div className="grid">
                            <Label htmlFor="issueDescription" className="text-lg">Cliente</Label>
                            <div className="flex gap-2">
                                <InputWithAdd
                                    id="client"
                                    placeholder="Cliente"
                                    value={formValues.customer}
                                    options={customerOptions}
                                    onChange={(value: string) => setFormValues((prev) => ({ ...prev, customer: value }))}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size={"icon-lg"}
                                    onClick={() => setIsCreateCustomerDialogOpen(true)}
                                >
                                    <Plus className="size-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="grid">
                            <Label htmlFor="deviceType" className="text-lg">Tipologia dispositivo</Label>
                            <div className="flex gap-2">
                                <InputWithAdd
                                    id="deviceType"
                                    placeholder="Es. iPhone 13"
                                    value={formValues.deviceType}
                                    options={deviceOptions}
                                    onCreate={async (value: string) => {
                                        await createDevice({ name: value });
                                        setDeviceOptions((prev) => Array.from(new Set([...prev, value])));
                                    }}
                                    onChange={(value: string) => setFormValues((prev) => ({ ...prev, deviceType: value }))}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size={"icon-lg"}
                                    onClick={() => setIsCreateDeviceDialogOpen(true)}
                                >
                                    <Plus className="size-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="issueDescription" className="text-lg">Descrizione difetto</Label>
                            <div className="flex gap-2">
                                <InputWithAdd
                                    id="issueDescription"
                                    placeholder="Descrivi il difetto"
                                    value={formValues.issueDescription}
                                    options={issueOptions}
                                    onChange={(value: string) => setFormValues((prev) => ({ ...prev, issueDescription: value }))}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size={"icon-lg"}
                                    onClick={() => setIsCreateIssueDialogOpen(true)}
                                >
                                    <Plus className="size-5" />
                                </Button>
                            </div>
                            <div className="flex w-full items-center gap-3 rounded-md border border-primary/15 bg-muted/30 px-3 py-2">
                                <Checkbox
                                    id="saveIssueInCatalog"
                                    className="size-5"
                                    checked={formValues.saveIssueInCatalog}
                                    onCheckedChange={(checked) =>
                                        setFormValues((prev) => ({ ...prev, saveIssueInCatalog: checked === true }))
                                    }
                                />
                                <Label htmlFor="saveIssueInCatalog" className="cursor-pointer text-sm sm:text-base">
                                    Salva questa descrizione tra i difetti
                                </Label>
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
                        <div className="grid gap-2">
                            <div className="flex w-full items-center gap-3 rounded-md border border-primary/15 bg-muted/30 px-3 py-2">
                                <Checkbox
                                    id="charger"
                                    className="size-5"
                                    checked={formValues.charger}
                                    onCheckedChange={(checked) =>
                                        setFormValues((prev) => ({ ...prev, charger: checked === true }))
                                    }
                                />
                                <Label htmlFor="charger" className="cursor-pointer text-lg">
                                    Alimentatore presente
                                </Label>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="flex w-full items-center gap-3 rounded-md border border-primary/15 bg-muted/30 px-3 py-2">
                                <Checkbox
                                    id="dataBackup"
                                    className="size-5"
                                    checked={formValues.dataBackup}
                                    onCheckedChange={(checked) =>
                                        setFormValues((prev) => ({ ...prev, dataBackup: checked === true }))
                                    }
                                />
                                <Label htmlFor="dataBackup" className="cursor-pointer text-lg">
                                    Backup dati
                                </Label>
                            </div>
                            <div className="grid">
                                <Label htmlFor="notes" className="text-lg">Note</Label>
                                <Input
                                    className="text-lg!"
                                    id="notes"
                                    placeholder="Note"
                                    value={formValues.notes}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        setFormValues((prev) => ({ ...prev, notes: event.target.value }))
                                    }
                                />
                            </div>
                        </div>
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
                        email: String(values.email).trim() === "" ? null : String(values.email).trim(),
                        vatNumber: String(values.vatNumber).trim() === "" ? null : String(values.vatNumber).trim(),
                    });

                    const customerOption = formatCustomerOption(
                        createdCustomer.firstName,
                        createdCustomer.lastName,
                        createdCustomer.phoneNumber
                    );
                    setCustomerOptions((prev) => Array.from(new Set([...prev, customerOption])));
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
                    setFormValues((prev) => ({ ...prev, issueDescription: createdIssue.description }));
                }}
            />
        </>
    );
};

export default CreateReportDialog;
