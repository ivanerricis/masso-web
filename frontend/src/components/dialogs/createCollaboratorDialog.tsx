import EntityDialogBase, { type FieldConfig } from "./entity-dialog-base";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const fields: FieldConfig[] = [
    { key: "firstName", label: "Nome", type: "text", placeholder: "Luca" },
    { key: "lastName", label: "Cognome", type: "text", placeholder: "Neri" },
    { key: "phoneNumber", label: "Telefono", type: "tel", placeholder: "+39 333 1234567" },
];

const CreateCollaboratorDialog = ({ open, onOpenChange }: Props) => {
    return (
        <EntityDialogBase
            open={open}
            onOpenChange={onOpenChange}
            title="Nuovo collaboratore"
            description="Inserisci i dati del collaboratore e conferma per salvare."
            fields={fields}
        />
    );
};

export default CreateCollaboratorDialog;
