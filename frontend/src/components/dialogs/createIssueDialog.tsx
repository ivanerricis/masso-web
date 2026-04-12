import EntityDialogBase, { type FieldConfig } from "./entity-dialog-base";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const fields: FieldConfig[] = [{ key: "description", label: "Descrizione", type: "textarea", placeholder: "Display rotto" }];

const CreateIssueDialog = ({ open, onOpenChange }: Props) => {
    return (
        <EntityDialogBase
            open={open}
            onOpenChange={onOpenChange}
            title="Nuovo difetto"
            description="Inserisci i dati del difetto e conferma per salvare."
            fields={fields}
        />
    );
};

export default CreateIssueDialog;
