import { getApiErrorMessage, listInterventions } from "@/lib/api";
import { formatInterventionType } from "@/lib/interventions";
import type { InterventionDto } from "@/types/dtos";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type InterventionCalendarEvent = {
    id: number;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource: InterventionDto;
};

const toEventDate = (interventionDate: string, time: string) => new Date(`${interventionDate}T${time}`);

const toCalendarEvent = (intervention: InterventionDto): InterventionCalendarEvent => {
    const title = `${intervention.customer} · ${formatInterventionType(intervention.type)}`;

    if (intervention.interventionDate && intervention.startTime && intervention.endTime) {
        return {
            id: intervention.id,
            title,
            start: toEventDate(intervention.interventionDate, intervention.startTime),
            end: toEventDate(intervention.interventionDate, intervention.endTime),
            resource: intervention,
        };
    }

    // Le consegne materiale hanno solo una data (senza orario). I record creati prima
    // dell'introduzione di questo campo non hanno interventionDate: in quel caso si usa
    // la data di creazione come ripiego.
    const fallbackDate = intervention.interventionDate
        ? new Date(`${intervention.interventionDate}T00:00:00`)
        : new Date(intervention.createdAt);

    return {
        id: intervention.id,
        title,
        start: fallbackDate,
        end: fallbackDate,
        allDay: true,
        resource: intervention,
    };
};

export const useCalendarInterventions = () => {
    const [events, setEvents] = useState<InterventionCalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Come in usePaginatedRows: un reload richiesto dopo una modifica può risolversi
    // prima di quello che ha superato, quindi vale solo la risposta più recente.
    const latestRequestIdRef = useRef(0);

    const loadEvents = useCallback(async () => {
        const requestId = latestRequestIdRef.current + 1;
        latestRequestIdRef.current = requestId;
        setIsLoading(true);

        try {
            const interventions = await listInterventions();

            if (requestId !== latestRequestIdRef.current) {
                return;
            }

            setEvents(interventions.map(toCalendarEvent));
        } catch (error) {
            if (requestId !== latestRequestIdRef.current) {
                return;
            }

            toast.error(getApiErrorMessage(error, "Impossibile caricare gli interventi"));
        } finally {
            if (requestId === latestRequestIdRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        startTransition(() => {
            void loadEvents();
        });
    }, [loadEvents]);

    return { events, isLoading, loadEvents };
};
