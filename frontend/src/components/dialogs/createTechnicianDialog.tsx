import EntityDialogBase, { type FieldConfig } from "./entity-dialog-base";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const fields: FieldConfig[] = [
    { key: "firstName", label: "Nome", type: "text", placeholder: "Anna" },
    { key: "lastName", label: "Cognome", type: "text", placeholder: "Verdi" },
    { key: "phoneNumber", label: "Telefono", type: "tel", placeholder: "+39 333 1234567" },
    { key: "vatNumber", label: "Partita IVA", type: "text", placeholder: "IT12345678901" },
];

const CreateTechnicianDialog = ({ open, onOpenChange }: Props) => {
    return (
        <EntityDialogBase
            open={open}
            onOpenChange={onOpenChange}
            title="Nuovo tecnico"
            description="Inserisci i dati del tecnico e conferma per salvare."
            fields={fields}
        />
    );
};

export default CreateTechnicianDialog;
