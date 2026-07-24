import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import CustomDialog from "@/components/dialogs/customDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    username: string;
    password: string;
};

const GeneratedPasswordDialog = ({ open, onOpenChange, username, password }: Props) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(password);
            setIsCopied(true);
            toast.success("Password copiata negli appunti");
        } catch {
            toast.error("Impossibile copiare la password");
        }
    };

    return (
        <CustomDialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    setIsCopied(false);
                }
                onOpenChange(nextOpen);
            }}
            title="Password generata"
            description={`Questa password per "${username}" viene mostrata una sola volta: copiala ora e conservala in un posto sicuro. Al primo accesso verrà chiesto di impostarne una nuova.`}
            showCancelButton={false}
            confirmLabel="Ho copiato la password, chiudi"
            onConfirm={() => onOpenChange(false)}
            preventOutsideClose
            content={
                <div className="grid gap-2">
                    <Label htmlFor="generatedPassword">Password</Label>
                    <div className="flex gap-2">
                        <Input id="generatedPassword" readOnly value={password} className="font-mono" />
                        <Button type="button" variant="outline" size="icon" onClick={() => void handleCopy()}>
                            {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                        </Button>
                    </div>
                </div>
            }
        />
    );
};

export default GeneratedPasswordDialog;
