import CustomDialog from "@/components/dialogs/customDialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit?: (values: Record<string, string | boolean>) => Promise<void> | void;
};

const CreateIssueDialog = ({ open, onOpenChange, onSubmit }: Props) => {
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setDescription("");
        }
    }, [open]);

    const handleConfirm = async () => {
        if (description === "") {
            toast.error("Inserire una descrizione per il problema")
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
            await onSubmit({ description });
            onOpenChange(false);
            toast.success("Segnalazione creata con successo");
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
            title="Nuovo difetto"
            description="Inserisci i dati del difetto e conferma per salvare."
            confirmLabel={isSubmitting ? "Salvataggio..." : "Salva"}
            cancelLabel="Annulla"
            onCancel={() => onOpenChange(false)}
            onConfirm={() => void handleConfirm()}
            cancelDisabled={isSubmitting}
            confirmDisabled={isSubmitting}
            content={
                <div className="grid">
                    <Label htmlFor="description" className="text-lg">Descrizione</Label>
                    <Textarea
                        className="text-lg!"
                        id="description"
                        placeholder="Display rotto"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                </div>
            }
        />
    );
};

export default CreateIssueDialog;
