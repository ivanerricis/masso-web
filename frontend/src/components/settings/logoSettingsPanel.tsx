import { startTransition, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    SettingsActions,
    SettingsCard,
    SettingsGroup,
    SettingsLoadingBox,
    SettingsSection,
} from "@/components/settings/settingsUi";
import { getApiErrorMessage, getLogoStatus, resetLogo, uploadLogo } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

const logoAssetUrl = import.meta.env.VITE_LOGO_URL ?? "http://localhost:3000/assets/logo.jpg";
const maxLogoSizeBytes = 5 * 1024 * 1024;

const LogoSettingsPanel = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [hasCustomLogo, setHasCustomLogo] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadStatus = async () => {
        setIsLoading(true);

        try {
            const status = await getLogoStatus();
            setHasCustomLogo(status.hasCustomLogo);
            setUpdatedAt(status.updatedAt);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare lo stato del logo"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        startTransition(() => {
            void loadStatus();
        });
    }, []);

    const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
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
            setIsUploading(true);
            const status = await uploadLogo(file);
            setHasCustomLogo(status.hasCustomLogo);
            setUpdatedAt(status.updatedAt);
            toast.success("Logo aggiornato con successo");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare il logo"));
        } finally {
            setIsUploading(false);
        }
    };

    const handleReset = async () => {
        if (isResetting) {
            return;
        }

        try {
            setIsResetting(true);
            const status = await resetLogo();
            setHasCustomLogo(status.hasCustomLogo);
            setUpdatedAt(status.updatedAt);
            toast.success("Logo predefinito ripristinato");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile ripristinare il logo predefinito"));
        } finally {
            setIsResetting(false);
        }
    };

    const previewSrc = `${logoAssetUrl}?v=${encodeURIComponent(updatedAt ?? "default")}`;

    return (
        <SettingsSection>
            <SettingsCard
                title="Logo laboratorio"
                description="Carica un'immagine per sostituire il logo mostrato nell'app e nei report PDF."
            >
                {isLoading ? (
                    <SettingsLoadingBox />
                ) : (
                    <div className="grid gap-3 xl:grid-cols-2">
                        <SettingsGroup title="Logo attuale">
                            <div className="flex items-center gap-4">
                                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-primary/15 bg-background">
                                    <img src={previewSrc} alt="Logo attuale" className="size-full object-contain" />
                                </div>
                                <div className="grid gap-1 text-sm text-muted-foreground">
                                    <p>{hasCustomLogo ? "Logo personalizzato attivo" : "Logo predefinito attivo"}</p>
                                    {updatedAt ? <p>Ultimo aggiornamento: {formatDateTime(updatedAt)}</p> : null}
                                </div>
                            </div>

                            <SettingsActions>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!hasCustomLogo || isResetting || isUploading}
                                    onClick={() => void handleReset()}
                                >
                                    {isResetting ? "Ripristino..." : "Ripristina logo predefinito"}
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
                                    ref={fileInputRef}
                                    disabled={isUploading}
                                    onChange={(event) => void handleFileSelected(event)}
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

export default LogoSettingsPanel;
