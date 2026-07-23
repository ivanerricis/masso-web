import { startTransition, useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SearchInput from "@/components/search-input";
import TablePagination from "@/components/table-pagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
    getApiErrorMessage,
    getLogDownloadUrl,
    listLogEntries,
    listLogFiles,
    type LogEntryDto,
    type LogFileDto,
} from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";

const pageSize = 25;

const formatFileSize = (sizeBytes: number) => {
    if (sizeBytes < 1024) {
        return `${sizeBytes} B`;
    }

    if (sizeBytes < 1024 * 1024) {
        return `${(sizeBytes / 1024).toFixed(1)} KB`;
    }

    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDayKey = (dayKey: string) => formatDateTime(`${dayKey}T00:00:00.000Z`).split(",")[0]?.trim() ?? dayKey;

const LogsSettingsPanel = () => {
    const [logFiles, setLogFiles] = useState<LogFileDto[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [selectedDayKey, setSelectedDayKey] = useState<string>("");
    const [entries, setEntries] = useState<LogEntryDto[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingEntries, setIsLoadingEntries] = useState(false);
    const [searchText, setSearchText] = useState("");
    const debouncedSearchText = useDebouncedValue(searchText);
    const { currentPage, setCurrentPage } = useTablePagination({
        resetDependencies: [selectedDayKey, debouncedSearchText],
    });

    const loadLogFiles = useCallback(async () => {
        setIsLoadingFiles(true);

        try {
            const files = await listLogFiles();
            setLogFiles(files);
            setSelectedDayKey((current) =>
                current && files.some((file) => file.dayKey === current) ? current : files[0]?.dayKey ?? ""
            );
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare l'elenco dei log"));
        } finally {
            setIsLoadingFiles(false);
        }
    }, []);

    const loadEntries = useCallback(async () => {
        if (!selectedDayKey) {
            setEntries([]);
            setTotalItems(0);
            setTotalPages(1);
            return;
        }

        setIsLoadingEntries(true);

        try {
            const result = await listLogEntries(selectedDayKey, {
                page: currentPage,
                pageSize,
                search: debouncedSearchText,
            });
            setEntries(result.items);
            setTotalItems(result.totalItems);
            setTotalPages(result.totalPages);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare il log selezionato"));
        } finally {
            setIsLoadingEntries(false);
        }
    }, [selectedDayKey, currentPage, debouncedSearchText]);

    useEffect(() => {
        startTransition(() => {
            void loadLogFiles();
        });
    }, [loadLogFiles]);

    useEffect(() => {
        startTransition(() => {
            void loadEntries();
        });
    }, [loadEntries]);

    const handleDownload = () => {
        if (!selectedDayKey) {
            return;
        }

        window.location.href = getLogDownloadUrl(selectedDayKey);
    };

    const handleRefresh = () => {
        void loadLogFiles();
        void loadEntries();
    };

    return (
        <Card size="sm" className="border-primary/15 shadow-sm">
            <CardHeader className="border-b border-primary/10 bg-muted/20">
                <CardTitle>Log azioni</CardTitle>
                <CardDescription>Consulta il registro delle azioni eseguite sull'applicazione, giorno per giorno.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4">
                {isLoadingFiles && logFiles.length === 0 ? (
                    <div className="rounded-md border border-dashed border-primary/20 bg-muted/30 px-4 py-8 text-center text-muted-foreground">
                        Caricamento elenco log...
                    </div>
                ) : logFiles.length === 0 ? (
                    <div className="rounded-md border border-dashed border-primary/20 bg-muted/30 px-4 py-8 text-center text-muted-foreground">
                        Nessun log disponibile sul server.
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={selectedDayKey} onValueChange={setSelectedDayKey}>
                                <SelectTrigger className="w-full sm:w-auto sm:min-w-[220px]">
                                    <SelectValue placeholder="Seleziona una data" />
                                </SelectTrigger>
                                <SelectContent>
                                    {logFiles.map((file) => (
                                        <SelectItem key={file.dayKey} value={file.dayKey}>
                                            {`${formatDayKey(file.dayKey)} — ${formatFileSize(file.sizeBytes)}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <SearchInput value={searchText} onValueChange={setSearchText} placeholder="Cerca nel log..." />

                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={isLoadingEntries || isLoadingFiles}
                                onClick={handleRefresh}
                                aria-label="Aggiorna"
                            >
                                <RefreshCw className={cn("size-4", (isLoadingEntries || isLoadingFiles) && "animate-spin")} />
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="ml-auto"
                                disabled={!selectedDayKey}
                                onClick={handleDownload}
                            >
                                Scarica log selezionato
                            </Button>
                        </div>

                        <div className="rounded-md border border-primary/15">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data e ora</TableHead>
                                        <TableHead>IP</TableHead>
                                        <TableHead>Azione</TableHead>
                                        <TableHead>Stato</TableHead>
                                        <TableHead>Errore</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingEntries ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="whitespace-normal text-center text-muted-foreground">
                                                Caricamento log...
                                            </TableCell>
                                        </TableRow>
                                    ) : entries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="whitespace-normal text-center text-muted-foreground">
                                                Nessuna voce trovata per i criteri selezionati.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        entries.map((entry, index) => (
                                            <TableRow key={`${entry.timestamp}-${index}`}>
                                                <TableCell>{formatDateTime(entry.timestamp)}</TableCell>
                                                <TableCell>{entry.ip}</TableCell>
                                                <TableCell className="whitespace-normal">{entry.action}</TableCell>
                                                <TableCell className={cn(entry.status >= 400 && "font-semibold text-destructive")}>
                                                    {entry.status}
                                                </TableCell>
                                                <TableCell className="whitespace-normal text-destructive">
                                                    {entry.error ?? ""}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default LogsSettingsPanel;
