import { interventionsNotificationSource } from "./interventionsSource";
import { serverNotificationSource } from "./serverSource";
import type { NotificationSource } from "./types";

/** Ordine di comparsa nel menu: prima gli avvisi, poi i promemoria. */
export const notificationSources: NotificationSource[] = [serverNotificationSource, interventionsNotificationSource];

export type { AppNotification, NotificationSource } from "./types";
