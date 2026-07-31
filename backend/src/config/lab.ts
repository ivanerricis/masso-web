import { getCompanySettings } from "../services/companyManager";

// Tipo strutturale invece di `express.Request`: alcuni helper di stampa ricevono
// solo la parte di richiesta che serve a costruire l'URL assoluto del logo.
export type LabConfigRequest = {
    protocol: string;
    get: (name: string) => string | undefined;
};

export type LabConfig = {
    labName: string;
    labEmail: string;
    labAddress: string;
    labPhone: string;
    labLogoUrl: string;
};

// I dati del laboratorio finiscono nell'intestazione di ogni PDF. Il logo può essere
// configurato come URL assoluto (CDN esterno) oppure come percorso servito dal backend
// stesso, che va reso assoluto perché pdfmake scarica l'immagine via HTTP.
export const getLabConfig = async (req: LabConfigRequest): Promise<LabConfig> => {
    const company = await getCompanySettings();
    const configuredLogoUrl = process.env.LAB_LOGO_URL ?? "/assets/logo.jpg";
    const isAbsoluteLogoUrl = configuredLogoUrl.startsWith("http://") || configuredLogoUrl.startsWith("https://");
    const logoPath = configuredLogoUrl.startsWith("/") ? configuredLogoUrl : `/${configuredLogoUrl}`;

    return {
        labName: company.name,
        labEmail: company.email,
        labAddress: company.address,
        labPhone: company.phone,
        labLogoUrl: isAbsoluteLogoUrl ? configuredLogoUrl : `${req.protocol}://${req.get("host")}${logoPath}`,
    };
};
