import LoadingPage from "@/components/loadingPage";
import PageHeader from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import type { InterventionStatus } from "@/types/dtos";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { useMemo } from "react";
import { Calendar, dateFnsLocalizer, type EventPropGetter, type Messages } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-theme.css";
import { useNavigate } from "react-router-dom";
import { useCalendarInterventions, type InterventionCalendarEvent } from "./hooks/useCalendarInterventions";

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

const CalendarPage = () => {
    const navigate = useNavigate();
    const { events, isLoading } = useCalendarInterventions();

    const eventPropGetter = useMemo<EventPropGetter<InterventionCalendarEvent>>(
        () => (event) => ({
            style: statusEventStyle[event.resource.status],
        }),
        []
    );

    return (
        <div className="relative flex flex-col gap-4 w-full h-full">
            <PageHeader
                title="Calendario"
                description="Visualizza gli interventi in sede e da remoto già programmati e le consegne materiale in base alla data prevista."
            />

            <Card className="flex-1">
                <CardContent className="h-[calc(100vh-14rem)]">
                    <Calendar
                        localizer={localizer}
                        culture="it"
                        events={events}
                        messages={messages}
                        eventPropGetter={eventPropGetter}
                        onSelectEvent={(event) => navigate(`/interventions/${event.id}`)}
                        popup
                        style={{ height: "100%" }}
                    />
                </CardContent>
            </Card>

            {isLoading ? <LoadingPage className="absolute inset-0 z-10 rounded-2xl bg-background/70 backdrop-blur-sm" /> : null}
        </div>
    );
};

export default CalendarPage;
