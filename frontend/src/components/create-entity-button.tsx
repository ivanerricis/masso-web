import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlusCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { Label } from "./ui/label";

type CreateEntityButtonProps = Omit<ComponentProps<typeof Button>, "children"> & {
    label: string;
    onClick: NonNullable<ComponentProps<typeof Button>["onClick"]>;
};

const CreateEntityButton = ({ label, size = "lg", className, ...props }: CreateEntityButtonProps) => {
    return (
        <Button size={size} className={cn("text-lg", className)} {...props}>
            <PlusCircle className="size-5" />
            <Label className="hidden md:inline text-lg">{label}</Label>
        </Button>
    );
};

export default CreateEntityButton;
