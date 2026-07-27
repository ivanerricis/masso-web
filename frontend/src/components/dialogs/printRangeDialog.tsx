import { useEffect, useState } from "react";
import CustomDialog from "@/components/dialogs/customDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PrintRangeDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    onConfirm: (range: { dateFrom?: string; dateTo?: string }) => void;
};

const PrintRangeDialog = ({
    open,
    onOpenChange,
    title,
    description = "Specifica un intervallo di date oppure lascia i campi vuoti per stampare tutto lo storico.",
    onConfirm,
}: PrintRangeDialogProps) => {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    useEffect(() => {
        if (open) {
            setDateFrom("");
            setDateTo("");
        }
    }, [open]);

    const handleConfirm = () => {
        onConfirm({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
        onOpenChange(false);
    };

    return (
        <CustomDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            confirmLabel="Stampa"
            cancelLabel="Annulla"
            onCancel={() => onOpenChange(false)}
            onConfirm={handleConfirm}
            content={
                <div className="flex items-center gap-3">
                    <div className="grid flex-1 gap-1.5">
                        <Label htmlFor="print-range-date-from">Da</Label>
                        <Input
                            id="print-range-date-from"
                            type="date"
                            value={dateFrom}
                            max={dateTo || undefined}
                            onChange={(event) => setDateFrom(event.target.value)}
                        />
                    </div>
                    <div className="grid flex-1 gap-1.5">
                        <Label htmlFor="print-range-date-to">A</Label>
                        <Input
                            id="print-range-date-to"
                            type="date"
                            value={dateTo}
                            min={dateFrom || undefined}
                            onChange={(event) => setDateTo(event.target.value)}
                        />
                    </div>
                </div>
            }
        />
    );
};

export default PrintRangeDialog;
