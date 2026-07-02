import { useEffect, useState } from "react";
import { toast } from "sonner";
import CustomDialog from "@/components/dialogs/customDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    getApiErrorMessage,
    getBackupSettings,
    runBackupNow,
    updateBackupSettings,
    type BackupSettingsInput,
} from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

type BackupSettingsDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const defaultForm: BackupSettingsInput = {
    dumpEnabled: false,
    autoEnabled: false,
    frequencyDays: 1,
    runAt: "02:00",
    outputDir: "backups",
};

const BackupSettingsDialog = ({ open, onOpenChange }: BackupSettingsDialogProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isRunningBackup, setIsRunningBackup] = useState(false);
    const [formValues, setFormValues] = useState<BackupSettingsInput>(defaultForm);
    const [lastRunAt, setLastRunAt] = useState<string | null>(null);
    const [lastRunStatus, setLastRunStatus] = useState<"idle" | "success" | "failed">("idle");
    const [lastError, setLastError] = useState<string | null>(null);
    const [nextRunAt, setNextRunAt] = useState<string | null>(null);
    const [lastDumpPath, setLastDumpPath] = useState<string | null>(null);

    const loadSettings = async () => {
        setIsLoading(true);

        try {
            const settings = await getBackupSettings();
            setFormValues({
                dumpEnabled: settings.dumpEnabled,
                autoEnabled: settings.autoEnabled,
                frequencyDays: settings.frequencyDays,
                runAt: settings.runAt,
                outputDir: settings.outputDir,
            });
            setLastRunAt(settings.lastRunAt);
            setLastRunStatus(settings.lastRunStatus);
            setLastError(settings.lastError);
            setNextRunAt(settings.nextRunAt);
            setLastDumpPath(settings.lastDumpPath);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare le impostazioni backup"));
            onOpenChange(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        void loadSettings();
    }, [open]);

    const handleSave = async () => {
        if (isSaving || isLoading) {
            return;
        }

        if (!Number.isInteger(formValues.frequencyDays) || formValues.frequencyDays <= 0) {
            toast.error("La frequenza deve essere un numero intero positivo");
            return;
        }

        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(formValues.runAt)) {
            toast.error("L'orario deve essere nel formato HH:mm");
            return;
        }

        if (formValues.outputDir.trim() === "") {
            toast.error("Specifica una cartella di destinazione per il dump");
            return;
        }

        try {
            setIsSaving(true);
            const settings = await updateBackupSettings({
                ...formValues,
                outputDir: formValues.outputDir.trim(),
            });

            setLastRunAt(settings.lastRunAt);
            setLastRunStatus(settings.lastRunStatus);
            setLastError(settings.lastError);
            setNextRunAt(settings.nextRunAt);
            setLastDumpPath(settings.lastDumpPath);
            toast.success("Impostazioni backup salvate");
            onOpenChange(false);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile salvare le impostazioni backup"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleRunBackup = async () => {
        if (isRunningBackup || isLoading) {
            return;
        }

        try {
            setIsRunningBackup(true);
            const result = await runBackupNow();
            setLastRunAt(result.lastRunAt);
            setLastRunStatus(result.lastRunStatus);
            setLastError(result.lastError);
            setNextRunAt(result.nextRunAt);
            setLastDumpPath(result.lastDumpPath);
            toast.success(result.message);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Dump database non riuscito"));
        } finally {
            setIsRunningBackup(false);
        }
    };

    return (
        <CustomDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Impostazioni backup database"
            description="Configura dump manuale e automatico del database"
            confirmLabel={isSaving ? "Salvataggio..." : "Salva"}
            cancelLabel="Chiudi"
            onCancel={() => onOpenChange(false)}
            onConfirm={() => void handleSave()}
            cancelDisabled={isSaving || isLoading || isRunningBackup}
            confirmDisabled={isSaving || isLoading || isRunningBackup}
            contentClassName="sm:max-w-2xl"
            content={
                <div className="grid gap-4 py-4">
                    {isLoading ? (
                        <div className="rounded-md border border-dashed border-primary/20 bg-muted/30 px-4 py-8 text-center text-muted-foreground">
                            Caricamento impostazioni...
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-3 rounded-md border border-primary/15 bg-muted/20 p-4">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="dumpEnabled"
                                        checked={formValues.dumpEnabled}
                                        onCheckedChange={(checked) =>
                                            setFormValues((prev) => ({
                                                ...prev,
                                                dumpEnabled: Boolean(checked),
                                            }))
                                        }
                                    />
                                    <Label htmlFor="dumpEnabled" className="text-base cursor-pointer">
                                        Abilita dump database
                                    </Label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="autoEnabled"
                                        checked={formValues.autoEnabled}
                                        disabled={!formValues.dumpEnabled}
                                        onCheckedChange={(checked) =>
                                            setFormValues((prev) => ({
                                                ...prev,
                                                autoEnabled: Boolean(checked),
                                            }))
                                        }
                                    />
                                    <Label htmlFor="autoEnabled" className="text-base cursor-pointer">
                                        Esegui dump in automatico
                                    </Label>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="frequencyDays">Ogni quanti giorni</Label>
                                        <Input
                                            id="frequencyDays"
                                            type="number"
                                            min={1}
                                            max={365}
                                            disabled={!formValues.dumpEnabled || !formValues.autoEnabled}
                                            value={formValues.frequencyDays}
                                            onChange={(event) =>
                                                setFormValues((prev) => ({
                                                    ...prev,
                                                    frequencyDays: Number(event.target.value),
                                                }))
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="runAt">Orario</Label>
                                        <Input
                                            id="runAt"
                                            type="time"
                                            disabled={!formValues.dumpEnabled || !formValues.autoEnabled}
                                            value={formValues.runAt}
                                            onChange={(event) =>
                                                setFormValues((prev) => ({
                                                    ...prev,
                                                    runAt: event.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="outputDir">Cartella dump sul server</Label>
                                    <Input
                                        id="outputDir"
                                        placeholder="es: backups oppure /app/backups"
                                        value={formValues.outputDir}
                                        disabled
                                        onChange={(event) =>
                                            setFormValues((prev) => ({
                                                ...prev,
                                                outputDir: event.target.value,
                                            }))
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        La cartella di destinazione segue la configurazione del compose/.env.
                                    </p>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="lg"
                                        disabled={isRunningBackup || isSaving}
                                        onClick={() => void handleRunBackup()}
                                    >
                                        {isRunningBackup ? "Dump in corso..." : "Esegui dump adesso"}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-2 rounded-md border border-primary/15 bg-muted/20 p-4 text-sm">
                                <p>Ultima esecuzione: {formatDateTime(lastRunAt)}</p>
                                <p>Stato ultima esecuzione: {lastRunStatus}</p>
                                <p>Prossima esecuzione: {formatDateTime(nextRunAt)}</p>
                                <p>Percorso ultimo dump: {lastDumpPath ?? "-"}</p>
                                {lastError ? (
                                    <p className="text-destructive">Ultimo errore: {lastError}</p>
                                ) : null}
                            </div>
                        </>
                    )}
                </div>
            }
        />
    );
};

export default BackupSettingsDialog;
