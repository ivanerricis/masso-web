import { ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type CardReportProps = {
    customerName: string;
    isClosed: boolean;
    deviceName: string;
    onOpen: () => void;
};

const CardReport = ({ customerName, isClosed, deviceName, onOpen }: CardReportProps) => {
    return (
        <div className="w-sm h-50 rounded-2xl flex flex-col justify-between gap-4 p-6 bg-card shadow-md border-2">
            <div className="flex items-start justify-between gap-4">
                <p className="text-lg font-bold p-2">{customerName}</p>
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
                <Button size={"icon-lg"} onClick={onOpen} aria-label="Apri report">
                    <ExternalLink className="size-5" />
                </Button>
            </div>
        </div>
    );
};

export default CardReport;