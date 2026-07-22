import { startTransition, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CustomDialog from "@/components/dialogs/customDialog";
import {
    checkForUpdates,
    getApiErrorMessage,
    getUpdateStatus,
    runUpdateNow,
    type UpdateStatusDto,
} from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

const POLL_INTERVAL_MS = 3000;
const CHECK_MAX_ATTEMPTS = 20; // ~1 minute
const UPDATE_MAX_ATTEMPTS = 120; // ~6 minutes

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const UpdateSettingsPanel = () => {
    const [status, setStatus] = useState<UpdateStatusDto | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const cancelledRef = useRef(false);

    useEffect(() => {
        cancelledRef.current = false;
        return () => {
            cancelledRef.current = true;
        };
    }, []);

    const loadStatus = async () => {
        setIsLoading(true);

        try {
            const result = await getUpdateStatus();
            if (!cancelledRef.current) {
                setStatus(result);
            }
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare lo stato dell'aggiornamento"));
        } finally {
            if (!cancelledRef.current) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        startTransition(() => {
            void loadStatus();
        });
    }, []);

    const handleCheck = async () => {
        if (isChecking || isUpdating) {
            return;
        }

        const previousCheckedAt = status?.lastCheckedAt ?? null;
        setIsChecking(true);

        try {
            await checkForUpdates();

            for (let attempt = 0; attempt < CHECK_MAX_ATTEMPTS; attempt += 1) {
                await sleep(POLL_INTERVAL_MS);
                if (cancelledRef.current) {
                    return;
                }

                try {
                    const result = await getUpdateStatus();
                    if (result.lastCheckedAt && result.lastCheckedAt !== previousCheckedAt) {
                        setStatus(result);
                        if (result.updateAvailable) {
                            toast.warning("È disponibile un aggiornamento", { richColors: true });
                        } else {
                            toast.success("Applicazione già aggiornata");
                        }
                        return;
                    }
                } catch {
                    // il backend potrebbe non rispondere per un istante, si ritenta
                }
            }

            toast.error("Verifica aggiornamenti: nessuna risposta, riprova più tardi");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile avviare la verifica aggiornamenti"));
        } finally {
            if (!cancelledRef.current) {
                setIsChecking(false);
            }
        }
    };

    const handleUpdate = async () => {
        if (isChecking || isUpdating) {
            return;
        }

        setIsConfirmOpen(false);
        const previousCommit = status?.currentCommit ?? null;
        setIsUpdating(true);

        try {
            await runUpdateNow();

            for (let attempt = 0; attempt < UPDATE_MAX_ATTEMPTS; attempt += 1) {
                await sleep(POLL_INTERVAL_MS);
                if (cancelledRef.current) {
                    return;
                }

                try {
                    const result = await getUpdateStatus();

                    if (result.state === "failed") {
                        setStatus(result);
                        toast.error(result.lastError ?? "Aggiornamento non riuscito");
                        return;
                    }

                    if (result.state === "success" && result.currentCommit !== previousCommit) {
                        setStatus(result);
                        toast.success("Aggiornamento completato. Ricarica la pagina.");
                        return;
                    }
                } catch {
                    // atteso: i container vengono ricreati durante l'aggiornamento
                }
            }

            toast.error("Aggiornamento in corso da troppo tempo, controlla lo stato del server");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile avviare l'aggiornamento"));
        } finally {
            if (!cancelledRef.current) {
                setIsUpdating(false);
            }
        }
    };

    const isBusy = isChecking || isUpdating || isLoading;

    return (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card size="sm" className="border-primary/15 shadow-sm">
                <CardHeader className="border-b border-primary/10 bg-muted/20">
                    <CardTitle>Aggiornamenti</CardTitle>
                    <CardDescription>Verifica e applica gli aggiornamenti dell'applicazione sul server.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 pt-4">
                    {isLoading && !status ? (
                        <div className="rounded-md border border-dashed border-primary/20 bg-muted/30 px-4 py-8 text-center text-muted-foreground">
                            Caricamento stato aggiornamento...
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-2 rounded-md border border-primary/15 bg-muted/20 p-3 text-sm">
                                <p>Versione corrente: {status?.currentCommit ?? "-"}</p>
                                <p>Ultima verifica: {formatDateTime(status?.lastCheckedAt ?? null)}</p>
                                {status?.updateAvailable ? (
                                    <p className="font-semibold text-primary">
                                        Aggiornamento disponibile ({status.remoteCommit})
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground">Nessun aggiornamento disponibile</p>
                                )}
                                {status?.state === "unknown" ? (
                                    <p className="text-xs text-muted-foreground">
                                        Servizio di aggiornamento non ancora configurato su questo server.
                                    </p>
                                ) : null}
                            </div>

                            <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isBusy}
                                    onClick={() => void handleCheck()}
                                >
                                    {isChecking ? "Verifica in corso..." : "Verifica aggiornamenti"}
                                </Button>
                                <Button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => setIsConfirmOpen(true)}
                                >
                                    {isUpdating ? "Aggiornamento in corso..." : "Aggiorna adesso"}
                                </Button>
                            </div>

                            <div className="grid gap-2 rounded-md border border-primary/15 bg-muted/20 p-3 text-sm">
                                <p>Ultimo aggiornamento: {formatDateTime(status?.lastUpdateAt ?? null)}</p>
                                <p>Esito: {status?.lastUpdateStatus ?? "-"}</p>
                                {status?.lastError ? <p className="text-destructive">Errore: {status.lastError}</p> : null}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <CustomDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title="Aggiorna applicazione"
                description="I servizi verranno ricostruiti e riavviati: l'applicazione sarà brevemente non raggiungibile. Continuare?"
                confirmLabel="Aggiorna adesso"
                cancelLabel="Annulla"
                onCancel={() => setIsConfirmOpen(false)}
                onConfirm={() => void handleUpdate()}
            />
        </div>
    );
};

export default UpdateSettingsPanel;
