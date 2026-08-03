import { startTransition, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    SettingsActions,
    SettingsCard,
    SettingsField,
    SettingsFieldRow,
    SettingsGroup,
    SettingsLoadingBox,
    SettingsSection,
} from "@/components/settings/settingsUi";
import {
    getApiErrorMessage,
    getCompanySettings,
    getLogoStatus,
    resetLogo,
    updateCompanySettings,
    uploadLogo,
    type CompanySettingsInput,
} from "@/lib/api";
import { isSettingsFormDirty } from "@/lib/settingsForm";
import { formatDateTime } from "@/lib/utils";

const logoAssetUrl = import.meta.env.VITE_LOGO_URL ?? "http://localhost:3000/assets/logo.jpg";
const maxLogoSizeBytes = 5 * 1024 * 1024;

const defaultForm: CompanySettingsInput = {
    name: "",
    email: "",
    address: "",
    phone: "",
};

const CompanySettingsPanel = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formValues, setFormValues] = useState<CompanySettingsInput>(defaultForm);
    const [savedValues, setSavedValues] = useState<CompanySettingsInput>(defaultForm);

    const [isLoadingLogo, setIsLoadingLogo] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isResettingLogo, setIsResettingLogo] = useState(false);
    const [hasCustomLogo, setHasCustomLogo] = useState(false);
    const [logoUpdatedAt, setLogoUpdatedAt] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const isDirty = isSettingsFormDirty(formValues, savedValues);

    const loadSettings = async () => {
        setIsLoading(true);

        try {
            const settings = await getCompanySettings();
            setFormValues(settings);
            setSavedValues(settings);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i dati dell'azienda"));
        } finally {
            setIsLoading(false);
        }
    };

    const loadLogoStatus = async () => {
        setIsLoadingLogo(true);

        try {
            const status = await getLogoStatus();
            setHasCustomLogo(status.hasCustomLogo);
            setLogoUpdatedAt(status.updatedAt);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare lo stato del logo"));
        } finally {
            setIsLoadingLogo(false);
        }
    };

    useEffect(() => {
        startTransition(() => {
            void loadSettings();
            void loadLogoStatus();
        });
    }, []);

    const handleSave = async () => {
        if (isSaving || isLoading) {
            return;
        }

        if (!formValues.name.trim()) {
            toast.error("Il nome dell'azienda è obbligatorio");
            return;
        }

        try {
            setIsSaving(true);
            const settings = await updateCompanySettings({
                name: formValues.name.trim(),
                email: formValues.email.trim(),
                address: formValues.address.trim(),
                phone: formValues.phone.trim(),
            });
            setFormValues(settings);
            setSavedValues(settings);
            toast.success("Dati azienda salvati");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile salvare i dati dell'azienda"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) {
            return;
        }

        if (file.size > maxLogoSizeBytes) {
            toast.error("Il file supera la dimensione massima di 5 MB");
            return;
        }

        try {
            setIsUploadingLogo(true);
            const status = await uploadLogo(file);
            setHasCustomLogo(status.hasCustomLogo);
            setLogoUpdatedAt(status.updatedAt);
            toast.success("Logo aggiornato con successo");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare il logo"));
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleLogoReset = async () => {
        if (isResettingLogo) {
            return;
        }

        try {
            setIsResettingLogo(true);
            const status = await resetLogo();
            setHasCustomLogo(status.hasCustomLogo);
            setLogoUpdatedAt(status.updatedAt);
            toast.success("Logo predefinito ripristinato");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile ripristinare il logo predefinito"));
        } finally {
            setIsResettingLogo(false);
        }
    };

    const logoPreviewSrc = `${logoAssetUrl}?v=${encodeURIComponent(logoUpdatedAt ?? "default")}`;

    return (
        <SettingsSection>
            <SettingsCard
                title="Azienda"
                description="Dati usati nell'intestazione dei PDF di report e interventi."
            >
                {isLoading ? (
                    <SettingsLoadingBox />
                ) : (
                    <>
                        <SettingsGroup>
                            <SettingsFieldRow>
                                <SettingsField>
                                    <Label htmlFor="companyName">Nome</Label>
                                    <Input
                                        id="companyName"
                                        placeholder="es: EasyLab"
                                        value={formValues.name}
                                        onChange={(event) =>
                                            setFormValues((prev) => ({ ...prev, name: event.target.value }))
                                        }
                                    />
                                </SettingsField>

                                <SettingsField>
                                    <Label htmlFor="companyEmail">Email</Label>
                                    <Input
                                        id="companyEmail"
                                        type="email"
                                        placeholder="es: info@easylab.local"
                                        value={formValues.email}
                                        onChange={(event) =>
                                            setFormValues((prev) => ({ ...prev, email: event.target.value }))
                                        }
                                    />
                                </SettingsField>
                            </SettingsFieldRow>

                            <SettingsFieldRow>
                                <SettingsField>
                                    <Label htmlFor="companyAddress">Indirizzo</Label>
                                    <Input
                                        id="companyAddress"
                                        placeholder="es: Via Roma 1, 00100 Roma"
                                        value={formValues.address}
                                        onChange={(event) =>
                                            setFormValues((prev) => ({ ...prev, address: event.target.value }))
                                        }
                                    />
                                </SettingsField>

                                <SettingsField>
                                    <Label htmlFor="companyPhone">Telefono</Label>
                                    <Input
                                        id="companyPhone"
                                        placeholder="es: +39 000 000 0000"
                                        value={formValues.phone}
                                        onChange={(event) =>
                                            setFormValues((prev) => ({ ...prev, phone: event.target.value }))
                                        }
                                    />
                                </SettingsField>
                            </SettingsFieldRow>
                        </SettingsGroup>

                        <SettingsActions>
                            <Button
                                type="button"
                                disabled={isSaving || isLoading || !isDirty}
                                onClick={() => void handleSave()}
                            >
                                {isSaving ? "Salvataggio..." : "Salva impostazioni"}
                            </Button>
                        </SettingsActions>
                    </>
                )}
            </SettingsCard>

            <SettingsCard
                title="Logo"
                description="Carica un'immagine per sostituire il logo mostrato nell'app e nei report PDF."
            >
                {isLoadingLogo ? (
                    <SettingsLoadingBox />
                ) : (
                    <div className="grid gap-3 xl:grid-cols-2">
                        <SettingsGroup title="Logo attuale">
                            <div className="flex items-center gap-4">
                                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-primary/15 bg-background">
                                    <img src={logoPreviewSrc} alt="Logo attuale" className="size-full object-contain" />
                                </div>
                                <div className="grid gap-1 text-sm text-muted-foreground">
                                    <p>{hasCustomLogo ? "Logo personalizzato attivo" : "Logo predefinito attivo"}</p>
                                    {logoUpdatedAt ? <p>Ultimo aggiornamento: {formatDateTime(logoUpdatedAt)}</p> : null}
                                </div>
                            </div>

                            <SettingsActions>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!hasCustomLogo || isResettingLogo || isUploadingLogo}
                                    onClick={() => void handleLogoReset()}
                                >
                                    {isResettingLogo ? "Ripristino..." : "Ripristina logo predefinito"}
                                </Button>
                            </SettingsActions>
                        </SettingsGroup>

                        <SettingsGroup title="Sostituisci logo">
                            <div className="grid gap-2">
                                <Label htmlFor="logoUpload">Carica nuovo logo</Label>
                                <Input
                                    id="logoUpload"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                                    ref={logoInputRef}
                                    disabled={isUploadingLogo}
                                    onChange={(event) => void handleLogoFileSelected(event)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Formati supportati: JPG, PNG, WEBP, GIF, SVG. Dimensione massima 5 MB. Il logo viene
                                    applicato subito dopo il caricamento.
                                </p>
                            </div>
                        </SettingsGroup>
                    </div>
                )}
            </SettingsCard>
        </SettingsSection>
    );
};

export default CompanySettingsPanel;
