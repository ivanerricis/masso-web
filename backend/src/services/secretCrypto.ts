import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const keyDir = path.join(process.cwd(), "data");
const keyFilePath = path.join(keyDir, "secret.key");
const algorithm = "aes-256-gcm";
const keyLength = 32;
const ivLength = 12;

let cachedKey: Buffer | null = null;

const loadOrCreateKey = async (): Promise<Buffer> => {
    if (cachedKey) {
        return cachedKey;
    }

    try {
        const raw = await fs.promises.readFile(keyFilePath, "utf-8");
        const key = Buffer.from(raw.trim(), "hex");

        if (key.length === keyLength) {
            cachedKey = key;
            return cachedKey;
        }
    } catch {
        // no key yet, fall through to generation
    }

    const key = crypto.randomBytes(keyLength);
    await fs.promises.mkdir(keyDir, { recursive: true });
    await fs.promises.writeFile(keyFilePath, `${key.toString("hex")}\n`, { encoding: "utf-8", mode: 0o600 });
    cachedKey = key;

    return cachedKey;
};

export const encryptSecret = async (plainText: string): Promise<string> => {
    const key = await loadOrCreateKey();
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf-8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
};

export const decryptSecret = async (payload: string): Promise<string> => {
    const [ivHex, authTagHex, dataHex] = payload.split(":");

    if (!ivHex || !authTagHex || !dataHex) {
        throw new Error("Formato del segreto cifrato non valido");
    }

    const key = await loadOrCreateKey();
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);

    return decrypted.toString("utf-8");
};
