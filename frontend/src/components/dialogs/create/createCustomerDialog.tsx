import CustomDialog from "@/components/dialogs/customDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit?: (values: Record<string, string | boolean>) => Promise<void> | void;
};

const CreateCustomerDialog = ({ open, onOpenChange, onSubmit }: Props) => {
    const [formValues, setFormValues] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        vatNumber: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setFormValues({
                firstName: "",
                lastName: "",
                phoneNumber: "",
                email: "",
                vatNumber: "",
            });
        }
    }, [open]);

    const handleConfirm = async () => {
        if (formValues.firstName === "") {
            toast.error("Il nome non può essere vuoto")
            return
        }

        if (formValues.phoneNumber === "") {
            toast.error("Il numero di telefono non può essere vuoto")
            return
        }

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
            toast.success("Cliente creato con successo");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile salvare i dati"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CustomDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Nuovo cliente"
            description="Inserisci i dati del cliente e conferma per salvare."
            confirmLabel={isSubmitting ? "Salvataggio..." : "Salva"}
            cancelLabel="Annulla"
            onCancel={() => onOpenChange(false)}
            onConfirm={() => void handleConfirm()}
            cancelDisabled={isSubmitting}
            confirmDisabled={isSubmitting}
            content={
                <div className="grid gap-6">
                    <div className="grid">
                        <Label htmlFor="firstName" className="text-lg">Nome (Nome azienda)</Label>
                        <Input
                            className="text-lg!"
                            id="firstName"
                            placeholder="Mario"
                            value={formValues.firstName}
                            onChange={(event) => setFormValues((prev) => ({ ...prev, firstName: event.target.value }))}
                        />
                    </div>
                    <div className="grid">
                        <Label htmlFor="lastName" className="text-lg">Cognome</Label>
                        <Input
                            className="text-lg!"
                            id="lastName"
                            placeholder="Rossi"
                            value={formValues.lastName}
                            onChange={(event) => setFormValues((prev) => ({ ...prev, lastName: event.target.value }))}
                        />
                    </div>
                    <div className="grid">
                        <Label htmlFor="phoneNumber" className="text-lg">Telefono</Label>
                        <Input
                            className="text-lg!"
                            id="phoneNumber"
                            type="tel"
                            placeholder="333 1234567"
                            value={formValues.phoneNumber}
                            onChange={(event) => setFormValues((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                        />
                    </div>
                    <div className="grid">
                        <Label htmlFor="email" className="text-lg">Email (opzionale)</Label>
                        <Input
                            className="text-lg!"
                            id="email"
                            type="email"
                            placeholder="mario.rossi@email.com"
                            value={formValues.email}
                            onChange={(event) => setFormValues((prev) => ({ ...prev, email: event.target.value }))}
                        />
                    </div>
                    <div className="grid">
                        <Label htmlFor="vatNumber" className="text-lg">Partita IVA (opzionale)</Label>
                        <Input
                            className="text-lg!"
                            id="vatNumber"
                            placeholder="IT12345678901"
                            value={formValues.vatNumber}
                            onChange={(event) => setFormValues((prev) => ({ ...prev, vatNumber: event.target.value }))}
                        />
                    </div>
                </div>
            }
        />
    );
};

export default CreateCustomerDialog;
