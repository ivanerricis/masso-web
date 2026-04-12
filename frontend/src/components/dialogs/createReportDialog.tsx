import EntityDialogBase, { type FieldConfig } from "./entity-dialog-base";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const fields: FieldConfig[] = [
    { key: "issueDescription", label: "Descrizione difetto", type: "textarea", placeholder: "Descrivi il difetto" },
    { key: "serviceDescription", label: "Descrizione intervento", type: "textarea", placeholder: "Descrivi l'intervento" },
    { key: "price", label: "Prezzo", type: "number", placeholder: "0" },
    { key: "closed", label: "Chiuso", type: "checkbox" },
    { key: "toInvoice", label: "Da fatturare", type: "checkbox" },
    { key: "dataBackup", label: "Backup dati", type: "checkbox" },
];

const CreateReportDialog = ({ open, onOpenChange }: Props) => {
    return (
        <EntityDialogBase
            open={open}
            onOpenChange={onOpenChange}
            title="Nuovo rapporto"
            description="Inserisci i dati del rapporto e conferma per salvare."
            fields={fields}
        />
    );
};

export default CreateReportDialog;
