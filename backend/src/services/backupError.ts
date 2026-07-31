/**
 * Modulo a sé perché è l'unica cosa che tutti i moduli del backup condividono: tenerlo
 * altrove creerebbe un ciclo di import fra stato, processi esterni e ripristino.
 */
export class BackupManagerError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}
