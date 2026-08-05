import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { formatInterventionStatus, formatInterventionTime, formatInterventionType } from "@/lib/interventions";
import { formatDate } from "@/lib/utils";
import type { InterventionStatus } from "@/types/dtos";
import { useState } from "react";
import type { EventProps } from "react-big-calendar";
import type { InterventionCalendarEvent } from "../hooks/useCalendarInterventions";

const statusBadgeClass: Record<InterventionStatus, string> = {
    completato: "bg-green-500/15 text-green-700 dark:text-green-400",
    in_lavorazione: "bg-yellow-400/20 text-yellow-700 dark:text-yellow-400",
    programmato: "bg-red-500/15 text-red-700 dark:text-red-400",
};

const formatSchedule = (intervention: InterventionCalendarEvent["resource"]) => {
    if (!intervention.interventionDate) {
        return "-";
    }

    if (!intervention.startTime || !intervention.endTime) {
        return formatDate(intervention.interventionDate);
    }

    return `${formatDate(intervention.interventionDate)} · ${formatInterventionTime(intervention.startTime)}-${formatInterventionTime(intervention.endTime)}`;
};

// Il popover si apre al passaggio del mouse (o al focus da tastiera): il click resta
// libero di propagarsi fino a .rbc-event, che naviga al dettaglio dell'intervento.
const CalendarEventPopover = ({ event, title }: EventProps<InterventionCalendarEvent>) => {
    const [open, setOpen] = useState(false);
    const intervention = event.resource;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverAnchor asChild>
                <span
                    className="block w-full truncate"
                    onMouseEnter={() => setOpen(true)}
                    onMouseLeave={() => setOpen(false)}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                >
                    {title}
                </span>
            </PopoverAnchor>
            <PopoverContent
                className="w-80"
                onOpenAutoFocus={(autoFocusEvent) => autoFocusEvent.preventDefault()}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
            >
                <div className="grid gap-3">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="font-semibold">{intervention.customer}</p>
                            <p className="text-sm text-muted-foreground">{intervention.collaborator}</p>
                        </div>
                        <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass[intervention.status]}`}
                        >
                            {formatInterventionStatus(intervention.status)}
                        </span>
                    </div>

                    <div className="grid gap-1 text-sm">
                        <p>
                            <span className="text-muted-foreground">Tipo: </span>
                            {formatInterventionType(intervention.type)}
                        </p>
                        <p>
                            <span className="text-muted-foreground">Quando: </span>
                            {formatSchedule(intervention)}
                        </p>
                    </div>

                    {intervention.description ? (
                        <p className="line-clamp-3 text-sm text-muted-foreground">{intervention.description}</p>
                    ) : null}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default CalendarEventPopover;
