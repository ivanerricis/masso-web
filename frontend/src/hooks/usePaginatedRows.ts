import { startTransition, useCallback, useEffect, useRef, useState, type DependencyList } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";
import type { PaginatedResponse } from "@/lib/api/client";

type UsePaginatedRowsOptions<TRow> = {
    /**
     * Esegue la richiesta per i parametri correnti. Non serve memoizzarla: viene
     * letta da una ref, quindi è sempre la versione dell'ultimo render.
     */
    fetchRows: () => Promise<PaginatedResponse<TRow>>;
    /** Parametri che identificano la richiesta: al loro cambio la lista si ricarica. */
    queryKey: DependencyList;
    /** Messaggio mostrato se la richiesta fallisce. */
    errorMessage: string;
    /** Alcune pagine partono senza skeleton perché montano già con dei filtri. */
    initialLoading?: boolean;
};

export const usePaginatedRows = <TRow>({
    fetchRows,
    queryKey,
    errorMessage,
    initialLoading = true,
}: UsePaginatedRowsOptions<TRow>) => {
    const [rows, setRows] = useState<TRow[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(initialLoading);

    const fetchRowsRef = useRef(fetchRows);
    const errorMessageRef = useRef(errorMessage);

    // Dichiarato prima dell'effetto di caricamento così la ref è già aggiornata
    // quando quest'ultimo parte.
    useEffect(() => {
        fetchRowsRef.current = fetchRows;
        errorMessageRef.current = errorMessage;
    });

    // Identifica la richiesta più recente: le risposte che arrivano dopo essere
    // state superate da una richiesta più nuova vengono scartate, altrimenti una
    // risposta lenta sovrascriverebbe la tabella con dati non più validi
    // (visibile digitando in fretta nella ricerca).
    const latestRequestIdRef = useRef(0);

    const reload = useCallback(async () => {
        const requestId = latestRequestIdRef.current + 1;
        latestRequestIdRef.current = requestId;
        setIsLoading(true);

        try {
            const response = await fetchRowsRef.current();

            if (requestId !== latestRequestIdRef.current) {
                return;
            }

            setRows(response.items);
            setTotalItems(response.totalItems);
            setTotalPages(response.totalPages);
        } catch (error) {
            if (requestId !== latestRequestIdRef.current) {
                return;
            }

            toast.error(getApiErrorMessage(error, errorMessageRef.current));
        } finally {
            if (requestId === latestRequestIdRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        startTransition(() => {
            void reload();
        });
        // Le dipendenze sono fornite dal chiamante tramite queryKey.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, queryKey);

    const updateRow = useCallback((matches: (row: TRow) => boolean, updater: (row: TRow) => TRow) => {
        setRows((currentRows) => currentRows.map((row) => (matches(row) ? updater(row) : row)));
    }, []);

    return {
        rows,
        totalItems,
        totalPages,
        isLoading,
        reload,
        updateRow,
    };
};
