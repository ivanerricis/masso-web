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
export const getLabConfig = (req: LabConfigRequest): LabConfig => {
    const configuredLogoUrl = process.env.LAB_LOGO_URL ?? "/assets/logo.jpg";
    const isAbsoluteLogoUrl =
        configuredLogoUrl.startsWith("http://") || configuredLogoUrl.startsWith("https://");
    const logoPath = configuredLogoUrl.startsWith("/") ? configuredLogoUrl : `/${configuredLogoUrl}`;

    return {
        labName: process.env.LAB_NAME ?? "Masso",
        labEmail: process.env.LAB_EMAIL ?? "info@masso.local",
        labAddress: process.env.LAB_ADDRESS ?? "Indirizzo laboratorio",
        labPhone: process.env.LAB_PHONE ?? "+39 000 000 0000",
        labLogoUrl: isAbsoluteLogoUrl
            ? configuredLogoUrl
            : `${req.protocol}://${req.get("host")}${logoPath}`,
    };
};
