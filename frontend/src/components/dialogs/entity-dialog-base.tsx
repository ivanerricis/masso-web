import CustomDialog from "@/components/dialogs/customDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";

type FieldConfig = {
    key: string;
    label: string;
    type: "text" | "email" | "tel" | "number" | "textarea" | "checkbox";
    placeholder?: string;
};

type EntityDialogBaseProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    fields: FieldConfig[];
    onSubmit?: (values: Record<string, string | boolean>) => Promise<void> | void;
};

const buildInitialValues = (fields: FieldConfig[]) => {
    return fields.reduce<Record<string, string | boolean>>((acc, field) => {
        acc[field.key] = field.type === "checkbox" ? false : "";
        return acc;
    }, {});
};

const EntityDialogBase = ({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Salva",
    fields,
}: EntityDialogBaseProps) => {
    const [formValues, setFormValues] = useState<Record<string, string | boolean>>(
        buildInitialValues(fields)
    );

    useEffect(() => {
        if (open) {
            setFormValues(buildInitialValues(fields));
        }
    }, [fields, open]);

    const handleInputChange = (key: string, value: string | boolean) => {
        setFormValues((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <CustomDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            confirmLabel={confirmLabel}
            cancelLabel="Annulla"
            onCancel={() => onOpenChange(false)}
            onConfirm={() => onOpenChange(false)}
            content={
                <div className="grid gap-6">
                    {fields.map((field) => (
                        <div key={field.key} className="grid">
                            {field.type === "checkbox" ? (
                                <Label className="flex items-center gap-2 text-lg cursor-pointer w-fit">
                                    <input
                                        className="size-5 cursor-pointer"
                                        type="checkbox"
                                        checked={Boolean(formValues[field.key])}
                                        onChange={(event) => handleInputChange(field.key, event.target.checked)}
                                    />
                                    {field.label}
                                </Label>
                            ) : (
                                <>
                                    <Label htmlFor={field.key} className="text-lg">{field.label}</Label>
                                    {field.type === "textarea" ? (
                                        <Textarea
                                            className="text-lg!"
                                            id={field.key}
                                            placeholder={field.placeholder}
                                            value={String(formValues[field.key] ?? "")}
                                            onChange={(event) => handleInputChange(field.key, event.target.value)}
                                        />
                                    ) : field.type === "text" ? (
                                        <Input
                                            className="text-lg!"
                                            id={field.key}
                                            placeholder={field.placeholder}
                                            value={String(formValues[field.key] ?? "")}
                                            onChange={(event) => handleInputChange(field.key, event.target.value)}
                                        />
                                    ) : (
                                        <Input
                                            className="text-lg!"
                                            id={field.key}
                                            type={field.type}
                                            placeholder={field.placeholder}
                                            value={String(formValues[field.key] ?? "")}
                                            onChange={(event) => handleInputChange(field.key, event.target.value)}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            }
        />
    );
};

export type { FieldConfig };
export default EntityDialogBase;
