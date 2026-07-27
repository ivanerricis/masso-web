import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { listInterventions } from "@/lib/api";
import { formatInterventionStatus, formatInterventionTime, getTodayDateString } from "@/lib/interventions";
import { cn } from "@/lib/utils";
import type { InterventionDto } from "@/types/dtos";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const byStartTime = (a: InterventionDto, b: InterventionDto) => {
    if (!a.startTime && !b.startTime) return 0;
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return a.startTime.localeCompare(b.startTime);
};

export function TodayInterventionsMenu() {
    const navigate = useNavigate();
    const [interventions, setInterventions] = useState<InterventionDto[]>([]);

    useEffect(() => {
        let cancelled = false;

        const loadTodayInterventions = async () => {
            try {
                const today = getTodayDateString();
                const response = await listInterventions({ page: 1, pageSize: 100, scheduledDate: today });

                if (!cancelled) {
                    setInterventions(response.items.slice().sort(byStartTime));
                }
            } catch {
                // Reminder widget: fail silently, it refreshes again shortly.
            }
        };

        void loadTodayInterventions();
        const intervalId = window.setInterval(() => void loadTodayInterventions(), REFRESH_INTERVAL_MS);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, []);

    const pendingCount = interventions.filter((intervention) => intervention.status !== "completato").length;

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon-lg" className="relative" aria-label="Interventi di oggi">
                            <Bell className="size-5" />
                            {pendingCount > 0 ? (
                                <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                                    {pendingCount > 9 ? "9+" : pendingCount}
                                </span>
                            ) : null}
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Interventi di oggi</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="font-normal text-muted-foreground">Interventi di oggi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {interventions.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        Nessun intervento in programma per oggi.
                    </div>
                ) : (
                    interventions.map((intervention) => (
                        <DropdownMenuItem
                            key={intervention.id}
                            className="flex-col items-start gap-0.5"
                            onClick={() => navigate(`/interventions/${intervention.id}`)}
                        >
                            <div className="flex w-full items-center justify-between gap-2">
                                <span className="font-medium">{intervention.customer}</span>
                                <span className="text-xs text-muted-foreground">
                                    {intervention.startTime ? formatInterventionTime(intervention.startTime) : ""}
                                </span>
                            </div>
                            <span
                                className={cn(
                                    "text-xs text-muted-foreground",
                                    intervention.status === "completato" && "line-through"
                                )}
                            >
                                {formatInterventionStatus(intervention.status)}
                            </span>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
