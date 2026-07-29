import { startTransition, useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Download, Play, RefreshCw, RotateCcw } from "lucide-react";
import CustomDialog from "@/components/dialogs/customDialog";
import { useAuth } from "@/components/use-auth";
import { useBusyGuard } from "@/components/use-busy-guard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    SettingsActions,
    SettingsCard,
    SettingsErrorNote,
    SettingsField,
    SettingsFieldRow,
    SettingsGroup,
    SettingsLoadingBox,
    SettingsSection,
    SettingsStatusBadge,
    SettingsTile,
    SettingsTileGrid,
    type SettingsRunStatus,
} from "@/components/settings/settingsUi";
import {
    getApiErrorMessage,
    getBackupDumpDownloadUrl,
    getBackupSettings,
    listBackupDumps,
    restoreBackupFromExisting,
    restoreBackupFromUpload,
    runBackupNow,
    testSmbConnection,
    updateBackupSettings,
    type BackupDumpFileDto,
    type BackupSettingsInput,
} from "@/lib/api";
import { cn, formatDateTime, formatFileSize } from "@/lib/utils";

const restoreConfirmKeyword = "RESTORE";

type PendingRestore = { type: "existing"; fileName: string } | { type: "upload"; file: File };

const defaultForm: BackupSettingsInput = {
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

const BackupSettingsPanel = () => {
    const { setBusy } = useBusyGuard();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isRunningBackup, setIsRunningBackup] = useState(false);
    const [formValues, setFormValues] = useState<BackupSettingsInput>(defaultForm);
    const [lastRunAt, setLastRunAt] = useState<string | null>(null);
    const [lastRunStatus, setLastRunStatus] = useState<SettingsRunStatus>("idle");
    const [lastError, setLastError] = useState<string | null>(null);
    const [nextRunAt, setNextRunAt] = useState<string | null>(null);
    const [lastDumpPath, setLastDumpPath] = useState<string | null>(null);
    const [dumpFiles, setDumpFiles] = useState<BackupDumpFileDto[]>([]);
    const [isLoadingDumps, setIsLoadingDumps] = useState(false);
    const [smbPasswordSet, setSmbPasswordSet] = useState(false);
    const [smbLastRunAt, setSmbLastRunAt] = useState<string | null>(null);
    const [smbLastStatus, setSmbLastStatus] = useState<SettingsRunStatus>("idle");
    const [smbLastError, setSmbLastError] = useState<string | null>(null);
    const [isTestingSmb, setIsTestingSmb] = useState(false);

    const [restoreUploadFile, setRestoreUploadFile] = useState<File | null>(null);
    const [resetSchemaOnRestore, setResetSchemaOnRestore] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null);
    const [restoreConfirmText, setRestoreConfirmText] = useState("");
    const [lastRestoreAt, setLastRestoreAt] = useState<string | null>(null);
    const [lastRestoreStatus, setLastRestoreStatus] = useState<SettingsRunStatus>("idle");
    const [lastRestoreError, setLastRestoreError] = useState<string | null>(null);
    const [lastRestoreFileName, setLastRestoreFileName] = useState<string | null>(null);
    const [secretsToReconfigure, setSecretsToReconfigure] = useState<string[]>([]);

    const loadSettings = async () => {
        setIsLoading(true);

        try {
            const settings = await getBackupSettings();
            setFormValues({
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
            setLastRestoreAt(settings.lastRestoreAt);
            setLastRestoreStatus(settings.lastRestoreStatus);
            setLastRestoreError(settings.lastRestoreError);
            setLastRestoreFileName(settings.lastRestoreFileName);
            setSecretsToReconfigure(settings.restoreSecretsToReconfigure);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare le impostazioni backup"));
        } finally {
            setIsLoading(false);
        }
    };

    const loadDumpFiles = async () => {
        setIsLoadingDumps(true);

        try {
            setDumpFiles(await listBackupDumps());
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

    const handleDownloadDump = (fileName: string) => {
        window.location.assign(getBackupDumpDownloadUrl(fileName));
    };

    const handleRunBackup = async () => {
        if (isRunningBackup || isLoading) {
            return;
        }

        try {
            setIsRunningBackup(true);
            setBusy({
                title: "Backup in corso...",
                description: formValues.smbEnabled
                    ? "Non chiudere o ricaricare la pagina: il database viene esportato e copiato sul NAS. Può richiedere alcuni minuti in base alla dimensione dei dati."
                    : "Non chiudere o ricaricare la pagina: l'operazione può richiedere alcuni minuti in base alla dimensione dei dati.",
            });

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
            setBusy(null);
        }
    };

    const handleRestoreFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) {
            return;
        }

        setRestoreUploadFile(file);
    };

    const openRestoreConfirm = (source: PendingRestore) => {
        setPendingRestore(source);
        setRestoreConfirmText("");
    };

    const closeRestoreConfirm = () => {
        if (isRestoring) {
            return;
        }

        setPendingRestore(null);
        setRestoreConfirmText("");
    };

    const handleConfirmRestore = async () => {
        if (!pendingRestore || isRestoring) {
            return;
        }

        try {
            setIsRestoring(true);
            setBusy({
                title: "Ripristino database in corso...",
                description: "Non chiudere o ricaricare la pagina: l'operazione può richiedere alcuni minuti in base alla dimensione del dump.",
            });

            const result =
                pendingRestore.type === "existing"
                    ? await restoreBackupFromExisting(pendingRestore.fileName, resetSchemaOnRestore)
                    : await restoreBackupFromUpload(pendingRestore.file, resetSchemaOnRestore);

            setLastRestoreAt(result.lastRestoreAt);
            setLastRestoreStatus(result.lastRestoreStatus);
            setLastRestoreError(result.lastRestoreError);
            setLastRestoreFileName(result.lastRestoreFileName);
            setSecretsToReconfigure(result.restoreSecretsToReconfigure);

            if (result.restoreSecretsToReconfigure.length > 0) {
                toast.warning(result.message, { richColors: true });
            } else {
                toast.success(result.message);
            }

            setPendingRestore(null);
            setRestoreConfirmText("");
            setRestoreUploadFile(null);
            setIsRestoring(false);
            setBusy(null);

            // I dati utente/sessione ripristinati non coincidono più con quelli con cui si è
            // effettuato l'accesso: forziamo un nuovo login per ripartire da uno stato coerente.
            // Navighiamo prima (senza "from" in state) così dopo il login si atterra sulla
            // dashboard e non sulla stessa pagina impostazioni da cui è partito il ripristino.
            navigate("/login", { replace: true });

            try {
                await logout();
            } catch {
                // La sessione corrente potrebbe già non esistere più nel database ripristinato.
            }
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Ripristino database non riuscito"));
            setIsRestoring(false);
            setBusy(null);
        }
    };

    const totalDumpsSize = dumpFiles.reduce((total, dump) => total + dump.sizeBytes, 0);

    return (
        <SettingsSection>
            <SettingsCard
                title="Stato backup"
                description="Riepilogo delle ultime esecuzioni e avvio di un dump immediato."
                action={
                    <Button
                        type="button"
                        disabled={isRunningBackup || isSaving || isLoading}
                        onClick={() => void handleRunBackup()}
                    >
                        <Play className="size-4" />
                        {isRunningBackup ? "Dump in corso..." : "Esegui dump adesso"}
                    </Button>
                }
            >
                {isLoading ? (
                    <SettingsLoadingBox />
                ) : (
                    <>
                        <SettingsTileGrid>
                            <SettingsTile label="Ultimo backup" value={formatDateTime(lastRunAt)} status={lastRunStatus} />
                            <SettingsTile
                                label="Prossima esecuzione"
                                value={nextRunAt ? formatDateTime(nextRunAt) : "Automazione disattivata"}
                            />
                            <SettingsTile
                                label="Ultima copia su NAS"
                                value={formatDateTime(smbLastRunAt)}
                                status={smbLastStatus}
                            />
                            <SettingsTile
                                label="Dump sul server"
                                value={
                                    dumpFiles.length === 0
                                        ? "Nessuno"
                                        : `${dumpFiles.length} — ${formatFileSize(totalDumpsSize)}`
                                }
                            />
                        </SettingsTileGrid>

                        {lastDumpPath ? (
                            <p className="text-xs text-muted-foreground">
                                Percorso ultimo dump: <span className="font-mono">{lastDumpPath}</span>
                            </p>
                        ) : null}

                        {lastError ? <SettingsErrorNote label="Ultimo errore backup" message={lastError} /> : null}
                        {smbLastError ? <SettingsErrorNote label="Ultimo errore NAS" message={smbLastError} /> : null}
                    </>
                )}
            </SettingsCard>

            <SettingsCard
                title="Configurazione"
                description="Pianificazione del dump automatico e copia su condivisione di rete. Le due sezioni si salvano insieme con il pulsante in fondo."
            >
                {isLoading ? (
                    <SettingsLoadingBox />
                ) : (
                    <>
                        <div className="grid gap-3 xl:grid-cols-2">
                            <SettingsGroup title="Pianificazione">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="autoEnabled"
                                        checked={formValues.autoEnabled}
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

                                <SettingsFieldRow>
                                    <SettingsField>
                                        <Label htmlFor="frequencyDays">Ogni quanti giorni</Label>
                                        <Input
                                            id="frequencyDays"
                                            type="number"
                                            min={1}
                                            max={365}
                                            disabled={!formValues.autoEnabled}
                                            value={formValues.frequencyDays}
                                            onChange={(event) =>
                                                setFormValues((prev) => ({
                                                    ...prev,
                                                    frequencyDays: Number(event.target.value),
                                                }))
                                            }
                                        />
                                    </SettingsField>

                                    <SettingsField>
                                        <Label htmlFor="runAt">Orario</Label>
                                        <Input
                                            id="runAt"
                                            type="time"
                                            disabled={!formValues.autoEnabled}
                                            value={formValues.runAt}
                                            onChange={(event) =>
                                                setFormValues((prev) => ({
                                                    ...prev,
                                                    runAt: event.target.value,
                                                }))
                                            }
                                        />
                                    </SettingsField>
                                </SettingsFieldRow>

                                <div className="grid gap-2">
                                    <Label htmlFor="maxBackupsToKeep">Numero di backup da mantenere</Label>
                                    <Input
                                        id="maxBackupsToKeep"
                                        type="number"
                                        min={1}
                                        max={365}
                                        value={formValues.maxBackupsToKeep}
                                        onChange={(event) =>
                                            setFormValues((prev) => ({
                                                ...prev,
                                                maxBackupsToKeep: Number(event.target.value),
                                            }))
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        I dump più vecchi oltre questo numero vengono eliminati automaticamente ad ogni
                                        nuovo backup.
                                    </p>
                                </div>

                                <div className="grid gap-1">
                                    <span className="text-sm font-medium">Cartella dump sul server</span>
                                    <p className="font-mono text-sm break-all">{formValues.outputDir || "-"}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Definita dalla configurazione del compose/.env, non modificabile da qui.
                                    </p>
                                </div>
                            </SettingsGroup>

                            <SettingsGroup title="Destinazione di rete (NAS)">
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
                                        Copia ogni backup su una condivisione SMB/CIFS
                                    </Label>
                                </div>

                                <SettingsFieldRow>
                                    <SettingsField>
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
                                    </SettingsField>

                                    <SettingsField>
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
                                    </SettingsField>
                                </SettingsFieldRow>

                                <SettingsFieldRow>
                                    <SettingsField>
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
                                    </SettingsField>

                                    <SettingsField>
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
                                    </SettingsField>
                                </SettingsFieldRow>

                                <SettingsFieldRow>
                                    <SettingsField>
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
                                    </SettingsField>

                                    <SettingsField>
                                        <Label htmlFor="smbUsername">Utente</Label>
                                        <Input
                                            id="smbUsername"
                                            disabled={!formValues.smbEnabled}
                                            value={formValues.smbUsername}
                                            onChange={(event) =>
                                                setFormValues((prev) => ({
                                                    ...prev,
                                                    smbUsername: event.target.value,
                                                }))
                                            }
                                        />
                                    </SettingsField>
                                </SettingsFieldRow>

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
                                        La password viene salvata cifrata. Lasciala vuota al salvataggio per mantenere
                                        quella già impostata.
                                    </p>
                                </div>

                                <SettingsActions>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={!formValues.smbEnabled || isTestingSmb}
                                        onClick={() => void handleTestSmbConnection()}
                                    >
                                        {isTestingSmb ? "Test in corso..." : "Testa connessione"}
                                    </Button>
                                </SettingsActions>
                            </SettingsGroup>
                        </div>

                        <SettingsActions>
                            <Button
                                type="button"
                                disabled={isSaving || isLoading || isRunningBackup}
                                onClick={() => void handleSave()}
                            >
                                {isSaving ? "Salvataggio..." : "Salva impostazioni"}
                            </Button>
                        </SettingsActions>
                    </>
                )}
            </SettingsCard>

            <SettingsCard
                title="Archivio dump"
                description="Dump presenti sul server: scaricali oppure ripristinali direttamente. Il ripristino sovrascrive i dati attuali ed è irreversibile."
                action={
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={isLoadingDumps}
                                onClick={() => void loadDumpFiles()}
                                aria-label="Aggiorna elenco dump"
                            >
                                <RefreshCw className={cn("size-4", isLoadingDumps && "animate-spin")} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Aggiorna elenco dump</TooltipContent>
                    </Tooltip>
                }
            >
                <div className="rounded-md border border-primary/15">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome file</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Dimensione</TableHead>
                                <TableHead className="text-right">Azioni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingDumps && dumpFiles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="whitespace-normal text-center text-muted-foreground">
                                        Caricamento elenco dump...
                                    </TableCell>
                                </TableRow>
                            ) : dumpFiles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="whitespace-normal text-center text-muted-foreground">
                                        Nessun dump disponibile sul server.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                dumpFiles.map((dump) => (
                                    <TableRow key={dump.fileName}>
                                        <TableCell className="whitespace-normal font-mono text-xs">
                                            {dump.fileName}
                                        </TableCell>
                                        <TableCell>{formatDateTime(dump.createdAt)}</TableCell>
                                        <TableCell>{formatFileSize(dump.sizeBytes)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => handleDownloadDump(dump.fileName)}
                                                            aria-label={`Scarica ${dump.fileName}`}
                                                        >
                                                            <Download className="size-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Scarica</TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            disabled={isRestoring}
                                                            onClick={() =>
                                                                openRestoreConfirm({
                                                                    type: "existing",
                                                                    fileName: dump.fileName,
                                                                })
                                                            }
                                                            aria-label={`Ripristina ${dump.fileName}`}
                                                        >
                                                            <RotateCcw className="size-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Ripristina questo dump</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </SettingsCard>

            <SettingsCard
                title="Ripristino da file esterno"
                description="Carica un dump che non si trova sul server per sovrascrivere i dati attuali. Operazione irreversibile: valuta di eseguire prima un dump del database corrente."
                destructive
            >
                {isLoading ? (
                    <SettingsLoadingBox destructive />
                ) : (
                    <>
                        <SettingsGroup destructive className="sm:grid-cols-[1fr_auto] sm:items-end">
                            <div className="grid gap-2">
                                <Label htmlFor="restoreUpload">File .tar.gz o .sql</Label>
                                <Input
                                    id="restoreUpload"
                                    type="file"
                                    accept=".sql,.gz,.tar.gz,text/plain,application/sql,application/gzip"
                                    disabled={isRestoring}
                                    onChange={handleRestoreFileSelected}
                                />
                                {restoreUploadFile ? (
                                    <p className="text-xs text-muted-foreground">
                                        File selezionato: {restoreUploadFile.name} (
                                        {formatFileSize(restoreUploadFile.size)})
                                    </p>
                                ) : null}
                            </div>
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={!restoreUploadFile || isRestoring}
                                onClick={() =>
                                    restoreUploadFile && openRestoreConfirm({ type: "upload", file: restoreUploadFile })
                                }
                            >
                                Ripristina da questo file
                            </Button>
                        </SettingsGroup>

                        {secretsToReconfigure.length > 0 ? (
                            <div className="grid gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                                <p className="font-medium">Password da reinserire dopo il ripristino</p>
                                <p className="text-muted-foreground">
                                    Le password sono cifrate con una chiave che resta sul server e non viene inclusa nei
                                    backup. Ripristinando su un&apos;altra macchina non sono più leggibili e vanno
                                    riscritte:
                                </p>
                                <ul className="list-disc pl-5">
                                    {secretsToReconfigure.map((secret) => (
                                        <li key={secret}>{secret}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        <SettingsGroup destructive className="text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-muted-foreground">Ultimo ripristino:</span>
                                <span className="font-medium">{formatDateTime(lastRestoreAt)}</span>
                                <SettingsStatusBadge status={lastRestoreStatus} />
                            </div>
                            <p className="text-muted-foreground">
                                Dump utilizzato: <span className="font-mono">{lastRestoreFileName ?? "-"}</span>
                            </p>
                            {lastRestoreError ? (
                                <SettingsErrorNote label="Ultimo errore" message={lastRestoreError} />
                            ) : null}
                        </SettingsGroup>
                    </>
                )}
            </SettingsCard>

            <CustomDialog
                open={pendingRestore !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeRestoreConfirm();
                    }
                }}
                title="Conferma ripristino database"
                description={
                    pendingRestore?.type === "existing"
                        ? `Stai per sovrascrivere il database con il dump "${pendingRestore.fileName}". L'operazione è irreversibile.`
                        : pendingRestore?.type === "upload"
                          ? `Stai per sovrascrivere il database con il file caricato "${pendingRestore.file.name}". L'operazione è irreversibile.`
                          : ""
                }
                content={
                    <div className="grid gap-3 py-2">
                        <div className="flex items-start gap-3 rounded-md border border-destructive/20 bg-muted/20 p-3">
                            <Checkbox
                                id="resetSchemaOnRestore"
                                checked={resetSchemaOnRestore}
                                disabled={isRestoring}
                                onCheckedChange={(checked) => setResetSchemaOnRestore(Boolean(checked))}
                            />
                            <Label htmlFor="resetSchemaOnRestore" className="cursor-pointer text-sm leading-snug font-normal">
                                Svuota lo schema prima del ripristino (consigliato se il dump contiene l&apos;intero
                                database)
                            </Label>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="restoreConfirmText">
                                Digita <span className="font-semibold">{restoreConfirmKeyword}</span> per confermare
                            </Label>
                            <Input
                                id="restoreConfirmText"
                                value={restoreConfirmText}
                                disabled={isRestoring}
                                onChange={(event) => setRestoreConfirmText(event.target.value)}
                                autoComplete="off"
                            />
                        </div>
                    </div>
                }
                confirmLabel={isRestoring ? "Ripristino in corso..." : "Ripristina"}
                cancelLabel="Annulla"
                onCancel={closeRestoreConfirm}
                onConfirm={() => void handleConfirmRestore()}
                cancelDisabled={isRestoring}
                confirmDisabled={isRestoring || restoreConfirmText !== restoreConfirmKeyword}
                preventOutsideClose={isRestoring}
                destructive
            />
        </SettingsSection>
    );
};

export default BackupSettingsPanel;
