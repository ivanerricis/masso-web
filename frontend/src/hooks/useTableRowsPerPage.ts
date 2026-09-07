import { useCallback, useState } from "react";
import { getStoredTableRowsPerPage, setStoredTableRowsPerPage, type TableRowsPerPageKey } from "@/lib/theme";

/**
 * Righe per pagina di una singola tabella, con scrittura immediata su localStorage.
 *
 * `tableKey` identifica la tabella (es. "interventions"): due pagine diverse ricordano
 * valori diversi. Prima il valore era globale e per giunta letto una sola volta nel
 * costruttore dello stato, quindi cambiarlo non aveva effetto finché non si cambiava pagina.
 */
export const useTableRowsPerPage = (tableKey: string) => {
    const [pageSize, setPageSize] = useState<TableRowsPerPageKey>(() => getStoredTableRowsPerPage(tableKey));

    const changePageSize = useCallback(
        (nextPageSize: TableRowsPerPageKey) => {
            setPageSize(nextPageSize);
            setStoredTableRowsPerPage(tableKey, nextPageSize);
        },
        [tableKey]
    );

    return [pageSize, changePageSize] as const;
};
