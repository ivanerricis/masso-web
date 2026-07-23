import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ComponentProps } from "react";

type TableActionButtonProps = Omit<ComponentProps<typeof Button>, "aria-label"> & {
    "aria-label": string;
};

const TableActionButton = ({ "aria-label": ariaLabel, ...props }: TableActionButtonProps) => {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button aria-label={ariaLabel} {...props} />
            </TooltipTrigger>
            <TooltipContent>{ariaLabel}</TooltipContent>
        </Tooltip>
    );
};

export default TableActionButton;
