import { describe, expect, it } from "vitest";
import { BackupManagerError, getBackupDumpPath, restoreBackupFromUpload } from "./backupManager";

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

describe("restoreBackupFromUpload", () => {
    it("rifiuta le estensioni diverse da .sql e .tar.gz", async () => {
        await expect(
            restoreBackupFromUpload(Buffer.from("x"), "malware.exe", false)
        ).rejects.toThrow("Il file caricato deve avere estensione .sql o .tar.gz");
    });

    it("rifiuta un archivio con estensione parziale", async () => {
        await expect(restoreBackupFromUpload(Buffer.from("x"), "backup.tar", false)).rejects.toThrow(
            BackupManagerError
        );
    });
});
