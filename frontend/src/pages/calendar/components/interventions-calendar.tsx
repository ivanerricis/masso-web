import LoadingPage from "@/components/loadingPage";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getStoredCalendarView, setStoredCalendarView } from "@/lib/calendarView";
import type { InterventionStatus } from "@/types/dtos";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, type EventPropGetter, type Messages, type View } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../calendar-theme.css";
import CalendarEventPopover from "./calendar-event-popover";
import { useNavigate } from "react-router-dom";
import { useCalendarInterventions, type InterventionCalendarEvent } from "../hooks/useCalendarInterventions";

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
    in_lavorazione: { backgroundColor: "var(--color-yellow-400)", color: "#000" },
    programmato: { backgroundColor: "var(--color-red-500)", color: "#fff" },
};

const components = { event: CalendarEventPopover };

type Props = Readonly<{
    className?: string;
}>;

const InterventionsCalendar = ({ className }: Props) => {
    const navigate = useNavigate();
    const { events, isLoading } = useCalendarInterventions();
    const [view, setView] = useState<View>(() => getStoredCalendarView());

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
                    popup
                    style={{ height: "100%" }}
                />
            </CardContent>

            {isLoading ? <LoadingPage className="absolute inset-0 z-10 rounded-2xl bg-background/70 backdrop-blur-sm" /> : null}
        </Card>
    );
};

export default InterventionsCalendar;
