import { startTransition, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    getApiErrorMessage,
    getBackupDumpDownloadUrl,
    getBackupSettings,
    listBackupDumps,
    runBackupNow,
    testSmbConnection,
    updateBackupSettings,
    type BackupDumpFileDto,
    type BackupSettingsInput,
} from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

const formatFileSize = (sizeBytes: number) => {
    if (sizeBytes < 1024) {
        return `${sizeBytes} B`;
    }

    if (sizeBytes < 1024 * 1024) {
        return `${(sizeBytes / 1024).toFixed(1)} KB`;
    }

    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

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
    smbEnabled: false,
    smbHost: "",
    smbShare: "",
    smbPath: "",
    smbDomain: "",
    smbPort: 445,
    smbUsername: "",
    smbPassword: "",
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
    const [dumpFiles, setDumpFiles] = useState<BackupDumpFileDto[]>([]);
    const [isLoadingDumps, setIsLoadingDumps] = useState(false);
    const [selectedDumpFileName, setSelectedDumpFileName] = useState<string>("");
    const [smbPasswordSet, setSmbPasswordSet] = useState(false);
    const [smbLastRunAt, setSmbLastRunAt] = useState<string | null>(null);
    const [smbLastStatus, setSmbLastStatus] = useState<"idle" | "success" | "failed">("idle");
    const [smbLastError, setSmbLastError] = useState<string | null>(null);
    const [isTestingSmb, setIsTestingSmb] = useState(false);

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
                smbEnabled: settings.smbEnabled,
                smbHost: settings.smbHost,
                smbShare: settings.smbShare,
                smbPath: settings.smbPath,
                smbDomain: settings.smbDomain,
                smbPort: settings.smbPort,
                smbUsername: settings.smbUsername,
                smbPassword: "",
            });
            setLastRunAt(settings.lastRunAt);
            setLastRunStatus(settings.lastRunStatus);
            setLastError(settings.lastError);
            setNextRunAt(settings.nextRunAt);
            setLastDumpPath(settings.lastDumpPath);
            setSmbPasswordSet(settings.smbPasswordSet);
            setSmbLastRunAt(settings.smbLastRunAt);
            setSmbLastStatus(settings.smbLastStatus);
            setSmbLastError(settings.smbLastError);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare le impostazioni backup"));
        } finally {
            setIsLoading(false);
        }
    };

    const loadDumpFiles = async () => {
        setIsLoadingDumps(true);

        try {
            const dumps = await listBackupDumps();
            setDumpFiles(dumps);
            setSelectedDumpFileName((current) =>
                current && dumps.some((dump) => dump.fileName === current) ? current : dumps[0]?.fileName ?? ""
            );
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare l'elenco dei dump"));
        } finally {
            setIsLoadingDumps(false);
        }
    };

    useEffect(() => {
        startTransition(() => {
            void loadSettings();
            void loadDumpFiles();
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

        if (formValues.smbEnabled) {
            if (!formValues.smbHost.trim() || !formValues.smbShare.trim() || !formValues.smbUsername.trim()) {
                toast.error("Per il NAS specifica almeno host, condivisione e utente");
                return;
            }

            if (!smbPasswordSet && !formValues.smbPassword?.trim()) {
                toast.error("Specifica una password per la connessione al NAS");
                return;
            }

            if (!Number.isInteger(formValues.smbPort) || formValues.smbPort <= 0 || formValues.smbPort > 65535) {
                toast.error("La porta SMB deve essere un numero valido");
                return;
            }
        }

        try {
            setIsSaving(true);
            const settings = await updateBackupSettings({
                ...formValues,
                outputDir: formValues.outputDir.trim(),
                smbHost: formValues.smbHost.trim(),
                smbShare: formValues.smbShare.trim(),
                smbPath: formValues.smbPath.trim(),
                smbDomain: formValues.smbDomain.trim(),
                smbUsername: formValues.smbUsername.trim(),
            });

            setLastRunAt(settings.lastRunAt);
            setLastRunStatus(settings.lastRunStatus);
            setLastError(settings.lastError);
            setNextRunAt(settings.nextRunAt);
            setLastDumpPath(settings.lastDumpPath);
            setSmbPasswordSet(settings.smbPasswordSet);
            setSmbLastRunAt(settings.smbLastRunAt);
            setSmbLastStatus(settings.smbLastStatus);
            setSmbLastError(settings.smbLastError);
            setFormValues((prev) => ({ ...prev, smbPassword: "" }));
            toast.success("Impostazioni backup salvate");
            onSaveSuccess?.();
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile salvare le impostazioni backup"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestSmbConnection = async () => {
        if (isTestingSmb) {
            return;
        }

        if (!formValues.smbHost.trim() || !formValues.smbShare.trim() || !formValues.smbUsername.trim()) {
            toast.error("Per testare la connessione specifica almeno host, condivisione e utente");
            return;
        }

        const password = formValues.smbPassword?.trim();

        if (!password) {
            toast.error("Inserisci la password nel campo qui sopra per testare la connessione");
            return;
        }

        try {
            setIsTestingSmb(true);
            const result = await testSmbConnection({
                host: formValues.smbHost.trim(),
                share: formValues.smbShare.trim(),
                path: formValues.smbPath.trim(),
                domain: formValues.smbDomain.trim(),
                port: formValues.smbPort,
                username: formValues.smbUsername.trim(),
                password,
            });
            toast.success(result.message);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Connessione al NAS non riuscita"));
        } finally {
            setIsTestingSmb(false);
        }
    };

    const handleDownloadSelectedDump = () => {
        if (!selectedDumpFileName) {
            return;
        }

        window.location.href = getBackupDumpDownloadUrl(selectedDumpFileName);
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
            setSmbLastRunAt(result.smbLastRunAt);
            setSmbLastStatus(result.smbLastStatus);
            setSmbLastError(result.smbLastError);

            if (result.smbEnabled && result.smbLastStatus === "failed") {
                toast.warning(result.message, { richColors: true });
            } else {
                toast.success(result.message);
            }

            void loadDumpFiles();
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

                            <div className="grid gap-2 rounded-md border border-primary/15 bg-muted/20 p-3">
                                <Label htmlFor="dumpFileSelect">Dump disponibili</Label>
                                {isLoadingDumps ? (
                                    <p className="text-sm text-muted-foreground">Caricamento elenco dump...</p>
                                ) : dumpFiles.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Nessun dump disponibile sul server.</p>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Select value={selectedDumpFileName} onValueChange={setSelectedDumpFileName}>
                                            <SelectTrigger id="dumpFileSelect" className="w-full sm:w-auto sm:min-w-[320px]">
                                                <SelectValue placeholder="Seleziona un dump" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dumpFiles.map((dump) => (
                                                    <SelectItem key={dump.fileName} value={dump.fileName}>
                                                        {`${dump.fileName} — ${formatDateTime(dump.createdAt)} — ${formatFileSize(dump.sizeBytes)}`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={!selectedDumpFileName}
                                            onClick={handleDownloadSelectedDump}
                                        >
                                            Scarica dump selezionato
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card size="sm" className="border-primary/15 shadow-sm">
                <CardHeader className="border-b border-primary/10 bg-muted/20">
                    <CardTitle>Destinazione di rete (NAS)</CardTitle>
                    <CardDescription>
                        Copia automaticamente ogni backup anche su una condivisione SMB/CIFS (es. una cartella di un NAS).
                    </CardDescription>
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
                                        id="smbEnabled"
                                        checked={formValues.smbEnabled}
                                        onCheckedChange={(checked) =>
                                            setFormValues((prev) => ({
                                                ...prev,
                                                smbEnabled: Boolean(checked),
                                            }))
                                        }
                                    />
                                    <Label htmlFor="smbEnabled" className="cursor-pointer">
                                        Copia i backup anche sul NAS
                                    </Label>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="smbHost">Host / IP del NAS</Label>
                                        <Input
                                            id="smbHost"
                                            placeholder="es: 192.168.1.10"
                                            disabled={!formValues.smbEnabled}
                                            value={formValues.smbHost}
                                            onChange={(event) =>
                                                setFormValues((prev) => ({ ...prev, smbHost: event.target.value }))
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="smbShare">Nome condivisione</Label>
                                        <Input
                                            id="smbShare"
                                            placeholder="es: backup"
                                            disabled={!formValues.smbEnabled}
                                            value={formValues.smbShare}
                                            onChange={(event) =>
                                                setFormValues((prev) => ({ ...prev, smbShare: event.target.value }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="smbPath">Sottocartella (opzionale)</Label>
                                        <Input
                                            id="smbPath"
                                            placeholder="es: masso-web"
                                            disabled={!formValues.smbEnabled}
                                            value={formValues.smbPath}
                                            onChange={(event) =>
                                                setFormValues((prev) => ({ ...prev, smbPath: event.target.value }))
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="smbPort">Porta</Label>
                                        <Input
                                            id="smbPort"
                                            type="number"
                                            min={1}
                                            max={65535}
                                            disabled={!formValues.smbEnabled}
                                            value={formValues.smbPort}
                                            onChange={(event) =>
                                                setFormValues((prev) => ({
                                                    ...prev,
                                                    smbPort: Number(event.target.value),
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="smbDomain">Dominio/Workgroup (opzionale)</Label>
                                        <Input
                                            id="smbDomain"
                                            placeholder="es: WORKGROUP"
                                            disabled={!formValues.smbEnabled}
                                            value={formValues.smbDomain}
                                            onChange={(event) =>
                                                setFormValues((prev) => ({ ...prev, smbDomain: event.target.value }))
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="smbUsername">Utente</Label>
                                        <Input
                                            id="smbUsername"
                                            disabled={!formValues.smbEnabled}
                                            value={formValues.smbUsername}
                                            onChange={(event) =>
                                                setFormValues((prev) => ({ ...prev, smbUsername: event.target.value }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="smbPassword">Password</Label>
                                    <Input
                                        id="smbPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder={smbPasswordSet ? "•••• (invariata, lascia vuoto)" : ""}
                                        disabled={!formValues.smbEnabled}
                                        value={formValues.smbPassword ?? ""}
                                        onChange={(event) =>
                                            setFormValues((prev) => ({ ...prev, smbPassword: event.target.value }))
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        La password viene salvata cifrata. Lasciala vuota al salvataggio per mantenere quella già impostata.
                                    </p>
                                </div>

                                <div className="flex flex-wrap justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={!formValues.smbEnabled || isTestingSmb}
                                        onClick={() => void handleTestSmbConnection()}
                                    >
                                        {isTestingSmb ? "Test in corso..." : "Testa connessione"}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-2 rounded-md border border-primary/15 bg-muted/20 p-3 text-sm">
                                <p>Ultima copia su NAS: {formatDateTime(smbLastRunAt)}</p>
                                <p>Stato ultima copia su NAS: {smbLastStatus}</p>
                                {smbLastError ? (
                                    <p className="text-destructive">Ultimo errore NAS: {smbLastError}</p>
                                ) : null}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default BackupSettingsPanel;