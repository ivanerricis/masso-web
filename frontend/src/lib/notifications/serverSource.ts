import { dismissNotification, listNotifications, type NotificationDto } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { NotificationSource } from "./types";

// Un evento che si ripete resta una voce sola: il contatore dice quante volte è successo.
const buildMeta = (notification: NotificationDto) => {
    const lastOccurred = formatDateTime(notification.lastOccurredAt);

    return notification.occurrences > 1 ? `${lastOccurred} · ${notification.occurrences}×` : lastOccurred;
};

/**
 * Avvisi scritti dal backend (per ora i fallimenti del backup automatico). Sono gli unici
 * che sopravvivono all'evento che li ha generati: restano finché qualcuno non li chiude,
 * anche se nel frattempo l'esecuzione successiva è andata a buon fine.
 */
export const serverNotificationSource: NotificationSource = {
    key: "server",
    label: "Avvisi di sistema",
    load: async () =>
        (await listNotifications()).map((notification) => ({
            id: String(notification.id),
            title: notification.title,
            description: notification.message ?? undefined,
            meta: buildMeta(notification),
            tone: notification.severity === "warning" ? "warning" : "default",
            href: notification.link ?? undefined,
        })),
    dismiss: (notificationId) => dismissNotification(Number(notificationId)),
};
