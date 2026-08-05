import { ApiError } from "./apiError";

/**
 * Modulo a sé perché è l'unica cosa che tutti i moduli del backup condividono: tenerlo
 * altrove creerebbe un ciclo di import fra stato, processi esterni e ripristino.
 */
export class BackupManagerError extends ApiError {}
