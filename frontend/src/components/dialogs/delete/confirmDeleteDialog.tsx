import CustomDialog from "@/components/dialogs/customDialog";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    isDeleting?: boolean;
    onConfirm: () => Promise<void> | void;
};

const ConfirmDeleteDialog = ({
    open,
    onOpenChange,
    title,
    description,
    isDeleting = false,
    onConfirm,
}: Props) => {
    return (
        <CustomDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            confirmLabel={isDeleting ? "Eliminazione..." : "Elimina"}
            cancelLabel="Annulla"
            onCancel={() => onOpenChange(false)}
            onConfirm={() => void onConfirm()}
            cancelDisabled={isDeleting}
            confirmDisabled={isDeleting}
            destructive
        />
    );
};

export default ConfirmDeleteDialog;
