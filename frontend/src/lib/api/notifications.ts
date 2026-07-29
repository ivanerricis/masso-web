import { api } from "./client";

export type NotificationDto = {
    id: number;
    severity: "info" | "warning";
    title: string;
    message: string | null;
    /** Rotta dell'app da aprire cliccando la notifica. */
    link: string | null;
    /** Quante volte lo stesso evento si è ripetuto senza essere chiuso. */
    occurrences: number;
    lastOccurredAt: string;
};

export const listNotifications = async () => (await api.get<NotificationDto[]>("/notifications")).data;

/** La chiusura è condivisa: vale per tutti gli utenti. */
export const dismissNotification = async (id: number) => {
    await api.post(`/notifications/${id}/dismiss`);
};
