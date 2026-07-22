import { startTransition, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    getApiErrorMessage,
    getBackupDownloadUrl,
    getBackupSettings,
    runBackupNow,
    updateBackupSettings,
    type BackupSettingsInput,
} from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

type BackupSettingsPanelProps = {
    onSaveSuccess?: () => void;
};

const defaultForm: BackupSettingsInput = {
    dumpEnabled: false,
    autoEnabled: false,
    frequencyDays: 1,
    runAt: "02:00",
    outputDir: "backups",
    maxBackupsToKeep: 14,
};

const BackupSettingsPanel = ({ onSaveSuccess }: BackupSettingsPanelProps) => {
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
                maxBackupsToKeep: settings.maxBackupsToKeep,
            });
            setLastRunAt(settings.lastRunAt);
            setLastRunStatus(settings.lastRunStatus);
            setLastError(settings.lastError);
            setNextRunAt(settings.nextRunAt);
            setLastDumpPath(settings.lastDumpPath);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare le impostazioni backup"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        startTransition(() => {
            void loadSettings();
        });
    }, []);

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

        if (!Number.isInteger(formValues.maxBackupsToKeep) || formValues.maxBackupsToKeep <= 0) {
            toast.error("Il numero di backup da mantenere deve essere un numero intero positivo");
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
            onSaveSuccess?.();
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile salvare le impostazioni backup"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadLastBackup = () => {
        window.location.href = getBackupDownloadUrl();
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
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card size="sm" className="border-primary/15 shadow-sm">
                <CardHeader className="border-b border-primary/10 bg-muted/20">
                    <CardTitle>Backup database</CardTitle>
                    <CardDescription>Configura il dump manuale e automatico del database.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 pt-4">
                    {isLoading ? (
                        <div className="rounded-md border border-dashed border-primary/20 bg-muted/30 px-4 py-8 text-center text-muted-foreground">
                            Caricamento impostazioni...
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-3 rounded-md border border-primary/15 bg-muted/20 p-3">
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
                                    <Label htmlFor="dumpEnabled" className="cursor-pointer">
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
                                    <Label htmlFor="autoEnabled" className="cursor-pointer">
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
                                    <Label htmlFor="maxBackupsToKeep">Numero di backup da mantenere</Label>
                                    <Input
                                        id="maxBackupsToKeep"
                                        type="number"
                                        min={1}
                                        max={365}
                                        disabled={!formValues.dumpEnabled}
                                        value={formValues.maxBackupsToKeep}
                                        onChange={(event) =>
                                            setFormValues((prev) => ({
                                                ...prev,
                                                maxBackupsToKeep: Number(event.target.value),
                                            }))
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        I dump più vecchi oltre questo numero vengono eliminati automaticamente ad ogni nuovo backup.
                                    </p>
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

                                <div className="flex flex-wrap justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={!lastDumpPath}
                                        onClick={handleDownloadLastBackup}
                                    >
                                        Scarica ultimo dump
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isRunningBackup || isSaving}
                                        onClick={() => void handleRunBackup()}
                                    >
                                        {isRunningBackup ? "Dump in corso..." : "Esegui dump adesso"}
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={isSaving || isLoading || isRunningBackup}
                                        onClick={() => void handleSave()}
                                    >
                                        {isSaving ? "Salvataggio..." : "Salva impostazioni"}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-2 rounded-md border border-primary/15 bg-muted/20 p-3 text-sm">
                                <p>Ultima esecuzione: {formatDateTime(lastRunAt)}</p>
                                <p>Stato ultima esecuzione: {lastRunStatus}</p>
                                <p>Prossima esecuzione: {formatDateTime(nextRunAt)}</p>
                                <p>Percorso ultimo dump: {lastDumpPath ?? "-"}</p>
                                {lastError ? <p className="text-destructive">Ultimo errore: {lastError}</p> : null}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default BackupSettingsPanel;