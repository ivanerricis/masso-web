import EntityDialogBase, { type FieldConfig } from "./entity-dialog-base";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const fields: FieldConfig[] = [{ key: "name", label: "Nome dispositivo", type: "text", placeholder: "iPhone 13" }];

const CreateDeviceDialog = ({ open, onOpenChange }: Props) => {
    return (
        <EntityDialogBase
            open={open}
            onOpenChange={onOpenChange}
            title="Nuovo dispositivo"
            description="Inserisci i dati del dispositivo e conferma per salvare."
            fields={fields}
        />
    );
};

export default CreateDeviceDialog;
