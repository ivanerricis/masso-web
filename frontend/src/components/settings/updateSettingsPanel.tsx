import { startTransition, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    SettingsCard,
    SettingsErrorNote,
    SettingsLoadingBox,
    SettingsSection,
    SettingsTile,
    SettingsTileGrid,
} from "@/components/settings/settingsUi";
import CustomDialog from "@/components/dialogs/customDialog";
import { useBusyGuard } from "@/components/use-busy-guard";
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
    const { setBusy } = useBusyGuard();
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
        setBusy({
            title: "Aggiornamento in corso...",
            description: "Non chiudere o ricaricare la pagina: l'applicazione si ricaricherà automaticamente al termine.",
        });

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
                        toast.success("Aggiornamento completato. Ricarico la pagina...");
                        await sleep(1500);
                        window.location.reload();
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
            setBusy(null);
        }
    };

    const isBusy = isChecking || isUpdating || isLoading;

    return (
        <SettingsSection>
            <SettingsCard
                title="Stato aggiornamenti"
                description="Verifica e applica gli aggiornamenti dell'applicazione sul server."
                action={
                    <>
                        <Button type="button" variant="outline" disabled={isBusy} onClick={() => void handleCheck()}>
                            {isChecking ? "Verifica in corso..." : "Verifica aggiornamenti"}
                        </Button>
                        <Button type="button" disabled={isBusy} onClick={() => setIsConfirmOpen(true)}>
                            {isUpdating ? "Aggiornamento in corso..." : "Aggiorna adesso"}
                        </Button>
                    </>
                }
            >
                {isLoading && !status ? (
                    <SettingsLoadingBox label="Caricamento stato aggiornamento..." />
                ) : (
                    <>
                        <SettingsTileGrid>
                            <SettingsTile label="Versione installata" value={status?.currentCommit ?? "-"} />
                            <SettingsTile
                                label="Ultima verifica"
                                value={formatDateTime(status?.lastCheckedAt ?? null)}
                            />
                            <SettingsTile
                                label="Aggiornamento disponibile"
                                value={status?.updateAvailable ? `Sì (${status.remoteCommit ?? "-"})` : "No"}
                                highlight={status?.updateAvailable}
                            />
                            <SettingsTile
                                label="Ultimo aggiornamento"
                                value={formatDateTime(status?.lastUpdateAt ?? null)}
                                status={status?.lastUpdateStatus ?? "idle"}
                            />
                        </SettingsTileGrid>

                        {status?.state === "unknown" ? (
                            <p className="text-xs text-muted-foreground">
                                Servizio di aggiornamento non ancora configurato su questo server.
                            </p>
                        ) : null}

                        {status?.lastError ? (
                            <SettingsErrorNote label="Ultimo errore" message={status.lastError} />
                        ) : null}
                    </>
                )}
            </SettingsCard>

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
        </SettingsSection>
    );
};

export default UpdateSettingsPanel;
