import CustomDialog from "@/components/dialogs/customDialog";
import CreateCustomerDialog from "@/components/dialogs/createCustomerDialog";
import CreateDeviceDialog from "@/components/dialogs/createDeviceDialog";
import CreateIssueDialog from "@/components/dialogs/createIssueDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createCustomer, createDevice, createIssue, getApiErrorMessage, listCustomers, listDevices, listIssues } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import InputWithAdd from "../inputWithAdd";
import { Input } from "../ui/input";
import { Bug, Laptop, UserPlus } from "lucide-react";

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
                        <div className="grid gap-2">
                            <Label htmlFor="issueDescription" className="text-lg">Cliente</Label>
                            <InputWithAdd
                                id="client"
                                placeholder="Cliente"
                                value={formValues.customer}
                                options={customerOptions}
                                onChange={(value) => setFormValues((prev) => ({ ...prev, customer: value }))}
                                required
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="w-fit"
                                onClick={() => setIsCreateCustomerDialogOpen(true)}
                            >
                                <UserPlus className="size-5" />
                                Crea nuovo cliente
                            </Button>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="deviceType" className="text-lg">Tipologia dispositivo</Label>
                            <InputWithAdd
                                id="deviceType"
                                placeholder="Es. iPhone 13"
                                value={formValues.deviceType}
                                options={deviceOptions}
                                onCreate={async (value) => {
                                    await createDevice({ name: value });
                                    setDeviceOptions((prev) => Array.from(new Set([...prev, value])));
                                }}
                                onChange={(value) => setFormValues((prev) => ({ ...prev, deviceType: value }))}
                                required
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="w-fit"
                                onClick={() => setIsCreateDeviceDialogOpen(true)}
                            >
                                <Laptop className="size-5" />
                                Crea nuova tipologia dispositivo
                            </Button>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="issueDescription" className="text-lg">Descrizione difetto</Label>
                            <InputWithAdd
                                id="issueDescription"
                                placeholder="Descrivi il difetto"
                                value={formValues.issueDescription}
                                options={issueOptions}
                                onCreate={async (value) => {
                                    await createIssue({ description: value });
                                    setIssueOptions((prev) => Array.from(new Set([...prev, value])));
                                }}
                                onChange={(value) => setFormValues((prev) => ({ ...prev, issueDescription: value }))}
                                required
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="w-fit"
                                onClick={() => setIsCreateIssueDialogOpen(true)}
                            >
                                <Bug className="size-5" />
                                Crea nuovo difetto
                            </Button>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes" className="text-lg">Note</Label>
                            <Input
                                className="text-lg!"
                                id="notes"
                                placeholder="Note"
                                value={formValues.notes}
                                onChange={(event) => setFormValues((prev) => ({ ...prev, notes: event.target.value }))}
                                required
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label className="flex w-fit cursor-pointer items-center gap-2 text-lg">
                                <input
                                    className="size-5 cursor-pointer"
                                    type="checkbox"
                                    checked={formValues.dataBackup}
                                    onChange={(event) => setFormValues((prev) => ({ ...prev, dataBackup: event.target.checked }))}
                                />
                                Backup dati
                            </Label>
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
