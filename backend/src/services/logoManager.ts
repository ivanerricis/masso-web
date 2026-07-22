import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const logoDir = path.join(dataDir, "logo");
const metaFilePath = path.join(logoDir, "meta.json");
const defaultLogoPath = path.join(process.cwd(), "public", "logo-placeholder.png");
const maxLogoSizeBytes = 5 * 1024 * 1024;

const allowedMimeTypes: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
};

export class LogoManagerError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

type LogoMeta = {
    fileName: string;
    mimeType: string;
    updatedAt: string;
};

const readMeta = async (): Promise<LogoMeta | null> => {
    try {
        const raw = await fs.promises.readFile(metaFilePath, "utf-8");
        return JSON.parse(raw) as LogoMeta;
    } catch {
        return null;
    }
};

const clearLogoDir = async () => {
    try {
        const entries = await fs.promises.readdir(logoDir);
        await Promise.all(entries.map((name) => fs.promises.unlink(path.join(logoDir, name)).catch(() => {})));
    } catch {
        // La cartella potrebbe non esistere ancora, nessun logo personalizzato da rimuovere.
    }
};

export const getLogoStatus = async () => {
    const meta = await readMeta();

    if (!meta) {
        return { hasCustomLogo: false, updatedAt: null as string | null };
    }

    return { hasCustomLogo: true, updatedAt: meta.updatedAt };
};

export const getLogoFile = async (): Promise<{ filePath: string; mimeType: string }> => {
    const meta = await readMeta();

    if (meta) {
        const filePath = path.join(logoDir, meta.fileName);

        try {
            await fs.promises.access(filePath);
            return { filePath, mimeType: meta.mimeType };
        } catch {
            // Il file referenziato nei metadati non esiste piu, uso il logo di default.
        }
    }

    return { filePath: defaultLogoPath, mimeType: "image/png" };
};

export const saveLogo = async (buffer: Buffer, mimeType: string) => {
    const extension = allowedMimeTypes[mimeType];

    if (!extension) {
        throw new LogoManagerError("Formato immagine non supportato. Usa JPG, PNG, WEBP, GIF o SVG.", 400);
    }

    if (buffer.byteLength === 0) {
        throw new LogoManagerError("Il file caricato e vuoto", 400);
    }

    if (buffer.byteLength > maxLogoSizeBytes) {
        throw new LogoManagerError("Il file supera la dimensione massima di 5 MB", 400);
    }

    await fs.promises.mkdir(logoDir, { recursive: true });
    await clearLogoDir();

    const fileName = `logo.${extension}`;
    await fs.promises.writeFile(path.join(logoDir, fileName), buffer);

    const meta: LogoMeta = {
        fileName,
        mimeType,
        updatedAt: new Date().toISOString(),
    };

    await fs.promises.writeFile(metaFilePath, `${JSON.stringify(meta, null, 2)}\n`, "utf-8");

    return getLogoStatus();
};

export const resetLogo = async () => {
    await clearLogoDir();
    return getLogoStatus();
};
