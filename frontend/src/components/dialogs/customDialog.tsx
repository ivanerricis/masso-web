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
import { Save, Trash } from "lucide-react";
import { Label } from "../ui/label";

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

  cancelDisabled?: boolean;
  confirmDisabled?: boolean;

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
  cancelDisabled = false,
  confirmDisabled = false,
  showCancelButton = true,
  showConfirmButton = true,
  destructive = false,
}: Props) => {
  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent className={destructive ? "border-destructive! border!" : "border-primary! border!"}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onConfirm?.();
          }}
        >
          <DialogHeader>
            {title ? <DialogTitle className="text-lg">{title}</DialogTitle> : null}
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>

          {content}

          {(showCancelButton || showConfirmButton) && (
            <DialogFooter className="mt-2">
              {showCancelButton && (
                <Button
                  type="button"
                  size={"lg"}
                  className="text-lg"
                  variant="outline"
                  onClick={onCancel}
                  disabled={cancelDisabled}
                >
                  {cancelLabel}
                </Button>
              )}

              {showConfirmButton && (
                <Button
                  type="submit"
                  size={"lg"}
                  variant={destructive ? "destructive" : "default"}
                  disabled={confirmDisabled}
                >
                  {destructive ? (
                    <Trash className="size-5" />
                  ) : (
                    <Save className="size-5" />
                  )}
                  <Label className="text-lg">{confirmLabel}</Label>
                </Button>
              )}
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomDialog;