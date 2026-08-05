import LoadingPage from "@/components/loadingPage";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getStoredCalendarView, setStoredCalendarView } from "@/lib/calendarView";
import CreateInterventionDialog, {
    type CreateInterventionSubmitValues,
} from "@/components/dialogs/create/createInterventionDialog";
import type { InterventionStatus } from "@/types/dtos";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { useMemo, useState } from "react";
import {
    Calendar,
    dateFnsLocalizer,
    type EventPropGetter,
    type Messages,
    type SlotInfo,
    type View,
} from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../calendar-theme.css";
import CalendarEventPopover from "./calendar-event-popover";
import { useNavigate } from "react-router-dom";
import type { InterventionCalendarEvent } from "../hooks/useCalendarInterventions";

const locales = { it };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

const messages: Messages = {
    date: "Data",
    time: "Ora",
    event: "Intervento",
    allDay: "Tutto il giorno",
    week: "Settimana",
    work_week: "Settimana lavorativa",
    day: "Giorno",
    month: "Mese",
    previous: "Indietro",
    next: "Avanti",
    yesterday: "Ieri",
    tomorrow: "Domani",
    today: "Oggi",
    agenda: "Agenda",
    noEventsInRange: "Nessun intervento programmato in questo intervallo.",
    showMore: (total) => `+${total} altri`,
};

// Stili inline: il CSS di react-big-calendar definisce già .rbc-event con la stessa
// specificità delle classi Tailwind e viene caricato dopo, quindi vincerebbe sempre lui.
const statusEventStyle: Record<InterventionStatus, { backgroundColor: string; color: string }> = {
    completato: { backgroundColor: "var(--color-green-500)", color: "#fff" },
    in_lavorazione: { backgroundColor: "var(--color-yellow-400)", color: "#fff" },
    programmato: { backgroundColor: "var(--color-red-500)", color: "#fff" },
};

const components = { event: CalendarEventPopover };

type Props = Readonly<{
    className?: string;
    events: InterventionCalendarEvent[];
    isLoading: boolean;
    onCreateIntervention: (values: CreateInterventionSubmitValues) => Promise<void> | void;
}>;

const InterventionsCalendar = ({ className, events, isLoading, onCreateIntervention }: Props) => {
    const navigate = useNavigate();
    const [view, setView] = useState<View>(() => getStoredCalendarView());
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [initialInterventionDate, setInitialInterventionDate] = useState("");

    const eventPropGetter = useMemo<EventPropGetter<InterventionCalendarEvent>>(
        () => (event) => ({
            style: statusEventStyle[event.resource.status],
        }),
        []
    );

    const handleViewChange = (nextView: View) => {
        setView(nextView);
        setStoredCalendarView(nextView);
    };

    // Il doppio click su una cella libera del calendario apre la creazione di un
    // nuovo intervento con la data precompilata; il click singolo (usato per il
    // drag-to-select) non deve aprire nulla.
    const handleSelectSlot = (slotInfo: SlotInfo) => {
        if (slotInfo.action !== "doubleClick") {
            return;
        }

        setInitialInterventionDate(format(slotInfo.start, "yyyy-MM-dd"));
        setIsCreateDialogOpen(true);
    };

    return (
        <Card className={cn("relative flex flex-col", className)}>
            <CardContent className="h-full overflow-x-auto">
                <Calendar
                    localizer={localizer}
                    culture="it"
                    events={events}
                    messages={messages}
                    view={view}
                    onView={handleViewChange}
                    eventPropGetter={eventPropGetter}
                    components={components}
                    onSelectEvent={(event) => navigate(`/interventions/${event.id}`)}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    popup
                    style={{ height: "100%" }}
                />
            </CardContent>

            <CreateInterventionDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSubmit={onCreateIntervention}
                initialDate={initialInterventionDate}
            />

            {isLoading ? (
                <LoadingPage className="absolute inset-0 z-10 rounded-2xl bg-background/70 backdrop-blur-sm" />
            ) : null}
        </Card>
    );
};

export default InterventionsCalendar;
