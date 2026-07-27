import { getApiErrorMessage, listInterventions } from "@/lib/api";
import { formatInterventionType } from "@/lib/interventions";
import type { InterventionDto } from "@/types/dtos";
import { startTransition, useCallback, useEffect, useState } from "react";
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

    const createdAtDate = new Date(intervention.createdAt);

    return {
        id: intervention.id,
        title,
        start: createdAtDate,
        end: createdAtDate,
        allDay: true,
        resource: intervention,
    };
};

export const useCalendarInterventions = () => {
    const [events, setEvents] = useState<InterventionCalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const interventions = await listInterventions();
            setEvents(interventions.map(toCalendarEvent));
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare gli interventi"));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        startTransition(() => {
            void loadEvents();
        });
    }, [loadEvents]);

    return { events, isLoading, loadEvents };
};
