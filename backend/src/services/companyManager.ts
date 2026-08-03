import fs from "node:fs";
import path from "node:path";

const settingsDir = path.join(process.cwd(), "data");
const settingsFilePath = path.join(settingsDir, "company-settings.json");

export type CompanySettingsState = {
    name: string;
    email: string;
    address: string;
    phone: string;
};

export class CompanyManagerError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

// Valori identici ai default storici di LAB_NAME/LAB_EMAIL/LAB_ADDRESS/LAB_PHONE in config/lab.ts,
// così il primo avvio senza company-settings.json non cambia nulla per chi già usa il .env.
const defaultState: CompanySettingsState = {
    name: process.env.LAB_NAME ?? "EasyLab",
    email: process.env.LAB_EMAIL ?? "info@easylab.local",
    address: process.env.LAB_ADDRESS ?? "Indirizzo laboratorio",
    phone: process.env.LAB_PHONE ?? "+39 000 000 0000",
};

let cachedState: CompanySettingsState | null = null;

const sanitizeState = (input: Partial<CompanySettingsState>): CompanySettingsState => ({
    name: typeof input.name === "string" && input.name.trim() ? input.name.trim() : defaultState.name,
    email: typeof input.email === "string" ? input.email.trim() : defaultState.email,
    address: typeof input.address === "string" ? input.address.trim() : defaultState.address,
    phone: typeof input.phone === "string" ? input.phone.trim() : defaultState.phone,
});

const persistState = async (state: CompanySettingsState) => {
    await fs.promises.mkdir(settingsDir, { recursive: true });
    await fs.promises.writeFile(settingsFilePath, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
};

const loadState = async () => {
    if (cachedState) {
        return cachedState;
    }

    try {
        const raw = await fs.promises.readFile(settingsFilePath, "utf-8");
        cachedState = sanitizeState(JSON.parse(raw) as Partial<CompanySettingsState>);
    } catch {
        cachedState = { ...defaultState };
        await persistState(cachedState);
    }

    return cachedState;
};

// Dopo un ripristino il file delle impostazioni è stato riscritto da fuori:
// la cache in memoria non rispecchia più il disco.
export const invalidateCompanySettingsCache = () => {
    cachedState = null;
};

export const getCompanySettings = async (): Promise<CompanySettingsState> => loadState();

export type CompanySettingsInput = CompanySettingsState;

export const updateCompanySettings = async (input: CompanySettingsInput) => {
    if (!input.name?.trim()) {
        throw new CompanyManagerError("Il nome dell'azienda è obbligatorio", 400);
    }

    const next = sanitizeState(input);
    await persistState(next);
    cachedState = next;

    return next;
};
