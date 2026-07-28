import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./secretCrypto";

describe("secretCrypto", () => {
    it("decifra ciò che ha cifrato", async () => {
        const plainText = "password-smtp-di-prova";

        expect(await decryptSecret(await encryptSecret(plainText))).toBe(plainText);
    });

    it("produce un payload diverso a ogni cifratura (IV casuale)", async () => {
        const plainText = "stesso-valore";

        expect(await encryptSecret(plainText)).not.toBe(await encryptSecret(plainText));
    });

    it("rifiuta un payload malformato", async () => {
        await expect(decryptSecret("non-un-payload")).rejects.toThrow(
            "Formato del segreto cifrato non valido"
        );
    });

    it("rifiuta un payload manomesso (auth tag GCM)", async () => {
        const [iv, authTag, data] = (await encryptSecret("valore")).split(":");
        const tamperedData = data.startsWith("00") ? `11${data.slice(2)}` : `00${data.slice(2)}`;

        await expect(decryptSecret([iv, authTag, tamperedData].join(":"))).rejects.toThrow();
    });
});
