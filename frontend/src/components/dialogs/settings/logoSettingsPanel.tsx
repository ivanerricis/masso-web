import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        void loadStatus();
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
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-primary/15 shadow-sm">
                <CardHeader className="border-b border-primary/10 bg-muted/20">
                    <CardTitle>Logo laboratorio</CardTitle>
                    <CardDescription>
                        Carica un&apos;immagine per sostituire il logo mostrato nell&apos;app e nei report PDF.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pt-6">
                    {isLoading ? (
                        <div className="rounded-md border border-dashed border-primary/20 bg-muted/30 px-4 py-8 text-center text-muted-foreground">
                            Caricamento impostazioni...
                        </div>
                    ) : (
                        <div className="grid gap-3 rounded-md border border-primary/15 bg-muted/20 p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-primary/15 bg-background">
                                    <img src={previewSrc} alt="Logo attuale" className="size-full object-contain" />
                                </div>
                                <div className="grid gap-1 text-sm text-muted-foreground">
                                    <p>{hasCustomLogo ? "Logo personalizzato attivo" : "Logo predefinito attivo"}</p>
                                    {updatedAt ? <p>Ultimo aggiornamento: {formatDateTime(updatedAt)}</p> : null}
                                </div>
                            </div>

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
                                    Formati supportati: JPG, PNG, WEBP, GIF, SVG. Dimensione massima 5 MB.
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    disabled={!hasCustomLogo || isResetting || isUploading}
                                    onClick={() => void handleReset()}
                                >
                                    {isResetting ? "Ripristino..." : "Ripristina logo predefinito"}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default LogoSettingsPanel;
