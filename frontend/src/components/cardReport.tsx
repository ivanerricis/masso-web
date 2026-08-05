import { ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "@/lib/utils";

type CardReportProps = {
    customerName: string;
    isClosed: boolean;
    deviceName: string;
    onOpen: () => void;
};

const CardReport = ({ customerName, isClosed, deviceName, onOpen }: CardReportProps) => {
    return (
        <div className="flex h-50 w-sm flex-col justify-between gap-4 rounded-2xl border-2 bg-card p-6 shadow-md">
            <div className="flex items-start justify-between gap-4">
                <p className="p-2 text-lg font-bold">{customerName}</p>
                <p
                    className={cn(
                        "rounded-md px-3 py-2 text-sm font-semibold text-white",
                        isClosed ? "bg-green-600" : "bg-red-600"
                    )}
                >
                    {isClosed ? "Chiuso" : "Aperto"}
                </p>
            </div>
            <div className="flex items-end justify-between gap-4">
                <p className="p-2 text-lg font-semibold text-yellow-500">{deviceName}</p>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size={"icon-lg"} onClick={onOpen} aria-label="Apri report">
                            <ExternalLink className="size-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Apri report</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
};

export default CardReport;
