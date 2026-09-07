import { describe, expect, it, vi } from "vitest";
import { smbPathPattern, testSmbConnection, type SmbConnectionConfig } from "./backupSmb";

const spawnMock = vi.hoisted(() => vi.fn());

vi.mock("node:child_process", () => ({ spawn: spawnMock }));

const config = (path: string): SmbConnectionConfig => ({
    host: "nas.local",
    share: "backup",
    path,
    domain: "",
    port: 445,
    username: "easylab",
    password: "segreta",
});

describe("smbPathPattern", () => {
    it.each(["", "backup", "backup/easylab", "Backup EasyLab", "cartella\\sotto", "a-b_c.d", "2026/07"])(
        "accetta il percorso legittimo %j",
        (path) => {
            expect(smbPathPattern.test(path)).toBe(true);
        }
    );

    // `;` separa i comandi di smbclient: da li' passano `get` e `put`, cioe' scrittura e
    // lettura di file locali qualsiasi con i privilegi del backend. Gli altri caratteri non
    // servono a un percorso e non hanno motivo di passare.
    it.each([
        "backup; get payload /app/dist/index.js; echo ",
        "backup; put /app/data/secret.key rubata; echo ",
        'backup" ; ls "',
        "backup`id`",
        "backup$(id)",
        "backup|id",
        "backup&id",
        "backup\nls",
        "backup'x'",
    ])("rifiuta il percorso ostile %j", (path) => {
        expect(smbPathPattern.test(path)).toBe(false);
    });
});

describe("testSmbConnection", () => {
    it("rifiuta un percorso ostile prima ancora di avviare smbclient", async () => {
        spawnMock.mockClear();

        await expect(testSmbConnection(config("backup; get payload /app/dist/index.js; echo "))).rejects.toThrow(
            /cartella remota/i
        );
        expect(spawnMock).not.toHaveBeenCalled();
    });
});
