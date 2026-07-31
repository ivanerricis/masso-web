import { describe, expect, it } from "vitest";
import {
    BackupManagerError,
    composeSmbErrorMessage,
    getBackupDumpPath,
    getBackupSortKey,
    isAlreadyExistsSmbError,
    restoreBackupFromUpload,
    sortBackupFileNamesByAge,
} from "./backupManager";

// Il nome file è l'unico filtro fra la richiesta e il filesystem: questi test
// coprono sia la retrocompatibilità col formato storico sia il traversal.
describe("getBackupDumpPath", () => {
    const expectStatus = async (fileName: string, statusCode: number) => {
        try {
            await getBackupDumpPath(fileName);
            expect.unreachable(`${fileName} avrebbe dovuto fallire`);
        } catch (error) {
            expect(error).toBeInstanceOf(BackupManagerError);
            expect((error as BackupManagerError).statusCode).toBe(statusCode);
        }
    };

    it("accetta il formato storico .sql (404: nome valido, file assente)", async () => {
        await expectStatus("db-dump-20260101-000000.sql", 404);
    });

    it("accetta il nuovo formato archivio .tar.gz", async () => {
        await expectStatus("db-backup-20260101-000000.tar.gz", 404);
    });

    it("rifiuta un nome che non segue nessuno dei due schemi", async () => {
        await expectStatus("qualsiasi-file.sql", 400);
        await expectStatus("db-backup-20260101-000000.zip", 400);
    });

    it("rifiuta il path traversal", async () => {
        await expectStatus("../../etc/passwd", 400);
        await expectStatus("../db-dump-20260101-000000.sql", 400);
    });

    it("rifiuta una data non conforme allo schema", async () => {
        await expectStatus("db-dump-2026-01-01.sql", 400);
    });
});

describe("ordinamento dei backup", () => {
    // Regressione reale: con 14 .sql legacy e la retention a 14, l'archivio appena
    // creato finiva in testa all'ordine alfabetico ('db-backup-' < 'db-dump-') e
    // veniva cancellato subito dopo essere stato scritto. L'upload sul NAS falliva
    // poi con "does not exist".
    it("mette il nuovo archivio per ultimo, non per primo", () => {
        const files = [
            "db-dump-20260701-020000.sql",
            "db-backup-20260729-113813.tar.gz",
            "db-dump-20260710-020000.sql",
        ];

        expect(sortBackupFileNamesByAge(files).at(-1)).toBe("db-backup-20260729-113813.tar.gz");
    });

    it("non cancella il piu recente quando la retention taglia i piu vecchi", () => {
        const legacy = Array.from(
            { length: 14 },
            (_, i) => `db-dump-202607${String(i + 1).padStart(2, "0")}-020000.sql`
        );
        const fresh = "db-backup-20260729-113813.tar.gz";

        const ordered = sortBackupFileNamesByAge([...legacy, fresh]);
        const toDelete = ordered.slice(0, ordered.length - 14);

        expect(toDelete).not.toContain(fresh);
        expect(toDelete).toEqual(["db-dump-20260701-020000.sql"]);
    });

    it("ordina per data anche fra formati diversi", () => {
        const ordered = sortBackupFileNamesByAge([
            "db-backup-20260729-113813.tar.gz",
            "db-dump-20260801-020000.sql",
            "db-backup-20260101-000000.tar.gz",
        ]);

        expect(ordered).toEqual([
            "db-backup-20260101-000000.tar.gz",
            "db-backup-20260729-113813.tar.gz",
            "db-dump-20260801-020000.sql",
        ]);
    });

    it("estrae il timestamp da entrambi i formati", () => {
        expect(getBackupSortKey("db-backup-20260729-113813.tar.gz")).toBe("20260729-113813");
        expect(getBackupSortKey("db-dump-20260729-113813.sql")).toBe("20260729-113813");
    });
});

describe("composeSmbErrorMessage", () => {
    // smbclient scrive le diagnostiche su stdout: ignorarlo lasciava come unico
    // messaggio "terminato con codice 1", inutile da leggere e soprattutto tale da
    // far sembrare un errore la cartella remota gia esistente.
    it("usa stdout quando stderr e vuoto", () => {
        expect(composeSmbErrorMessage("", "NT_STATUS_LOGON_FAILURE", 1)).toBe("NT_STATUS_LOGON_FAILURE");
    });

    it("unisce i due flussi quando ci sono entrambi", () => {
        expect(composeSmbErrorMessage("warn", "NT_STATUS_ACCESS_DENIED", 1)).toBe("warn | NT_STATUS_ACCESS_DENIED");
    });

    it("ripiega sul codice di uscita solo se non c'e output", () => {
        expect(composeSmbErrorMessage("  ", "  ", 1)).toBe("smbclient terminato con codice 1");
    });

    it("conserva il codice di collisione, che serve a riconoscere la cartella esistente", () => {
        const message = composeSmbErrorMessage("", "NT_STATUS_OBJECT_NAME_COLLISION making dir", 1);

        expect(isAlreadyExistsSmbError(message)).toBe(true);
    });
});

describe("isAlreadyExistsSmbError", () => {
    it("riconosce entrambi i codici usati dalle varie versioni di Samba", () => {
        expect(isAlreadyExistsSmbError("NT_STATUS_OBJECT_NAME_COLLISION")).toBe(true);
        expect(isAlreadyExistsSmbError("NT_STATUS_OBJECT_NAME_EXISTS")).toBe(true);
    });

    it("non scambia per collisione un errore diverso", () => {
        expect(isAlreadyExistsSmbError("NT_STATUS_ACCESS_DENIED")).toBe(false);
        expect(isAlreadyExistsSmbError("smbclient terminato con codice 1")).toBe(false);
    });
});

describe("restoreBackupFromUpload", () => {
    it("rifiuta le estensioni diverse da .sql e .tar.gz", async () => {
        await expect(restoreBackupFromUpload(Buffer.from("x"), "malware.exe", false)).rejects.toThrow(
            "Il file caricato deve avere estensione .sql o .tar.gz"
        );
    });

    it("rifiuta un archivio con estensione parziale", async () => {
        await expect(restoreBackupFromUpload(Buffer.from("x"), "backup.tar", false)).rejects.toThrow(
            BackupManagerError
        );
    });
});
