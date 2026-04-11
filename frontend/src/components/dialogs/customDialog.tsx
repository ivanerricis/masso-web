import type { ReactNode } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

type Props = Readonly<{
  content?: ReactNode;
  trigger?: ReactNode;

  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  title?: ReactNode;
  description?: ReactNode;

  cancelLabel?: ReactNode;
  confirmLabel?: ReactNode;

  onCancel?: () => void;
  onConfirm?: () => void;

  showCancelButton?: boolean;
  showConfirmButton?: boolean;

  destructive?: boolean;
}>;

const CustomDialog = ({
  content,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  cancelLabel = "Annulla",
  confirmLabel = "Conferma",
  onCancel,
  onConfirm,
  showCancelButton = true,
  showConfirmButton = true,
  destructive = false,
}: Props) => {
  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent className={destructive ? "border-destructive! border!" : "border-primary! border!"}>
        <DialogHeader>
          {title ? <DialogTitle>{title}</DialogTitle> : null}
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        {content}

        {(showCancelButton || showConfirmButton) && (
          <DialogFooter>
            {showCancelButton && (
              <Button variant="outline" onClick={onCancel}>
                {cancelLabel}
              </Button>
            )}

            {showConfirmButton && (
              <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomDialog;