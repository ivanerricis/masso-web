import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import type { ComponentProps } from "react";

type OpenEntityButtonProps = Omit<ComponentProps<typeof Button>, "children">;

const OpenEntityButton = ({ size = "lg", className, "aria-label": ariaLabel, ...props }: OpenEntityButtonProps) => {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    size={size}
                    className={cn("text-lg border-0", className)}
                    aria-label={ariaLabel}
                    {...props}
                >
                    <ExternalLink className="size-5" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>{ariaLabel ?? "Apri"}</TooltipContent>
        </Tooltip>
    );
};

export default OpenEntityButton;