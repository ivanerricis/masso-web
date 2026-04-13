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

const CreateDeviceDialog = ({ open, onOpenChange, onSubmit }: Props) => {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setName("");
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
            await onSubmit({ name });
            onOpenChange(false);
            toast.success("Dispositivo creato con successo");
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
            title="Nuovo dispositivo"
            description="Inserisci i dati del dispositivo e conferma per salvare."
            confirmLabel={isSubmitting ? "Salvataggio..." : "Salva"}
            cancelLabel="Annulla"
            onCancel={() => onOpenChange(false)}
            onConfirm={() => void handleConfirm()}
            cancelDisabled={isSubmitting}
            confirmDisabled={isSubmitting}
            content={
                <div className="grid">
                    <Label htmlFor="name" className="text-lg">Nome dispositivo</Label>
                    <Input
                        className="text-lg!"
                        id="name"
                        placeholder="iPhone 13"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                </div>
            }
        />
    );
};

export default CreateDeviceDialog;
