import EntityDialogBase, { type FieldConfig } from "./entity-dialog-base";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const fields: FieldConfig[] = [
    { key: "firstName", label: "Nome", type: "text", placeholder: "Mario" },
    { key: "lastName", label: "Cognome", type: "text", placeholder: "Rossi" },
    { key: "phoneNumber", label: "Telefono", type: "tel", placeholder: "+39 333 1234567" },
    { key: "email", label: "Email", type: "email", placeholder: "mario.rossi@email.com" },
    { key: "vatNumber", label: "Partita IVA", type: "text", placeholder: "IT12345678901" },
];

const CreateCustomerDialog = ({ open, onOpenChange }: Props) => {
    return (
        <EntityDialogBase
            open={open}
            onOpenChange={onOpenChange}
            title="Nuovo cliente"
            description="Inserisci i dati del cliente e conferma per salvare."
            fields={fields}
        />
    );
};

export default CreateCustomerDialog;
