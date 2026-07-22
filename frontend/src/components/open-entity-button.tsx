import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import type { ComponentProps } from "react";

type OpenEntityButtonProps = Omit<ComponentProps<typeof Button>, "children">;

const OpenEntityButton = ({ size = "lg", className, ...props }: OpenEntityButtonProps) => {
    return (
        <Button variant="outline" size={size} className={cn("text-lg border-0", className)} {...props}>
            <ExternalLink className="size-5" />
        </Button>
    );
};

export default OpenEntityButton;