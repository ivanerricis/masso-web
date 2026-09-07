import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import RowsPerPageSelect from "@/components/rows-per-page-select";
import type { TableRowsPerPageKey } from "@/lib/theme";

type TablePaginationProps = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    /**
     * Quando c'è, a destra (accanto ai controlli di pagina) compare il selettore delle righe
     * per pagina. È il punto giusto in cui metterlo: questo componente è già sotto ogni
     * tabella dell'app, mentre la barra dei filtri esiste solo su tre pagine su dodici.
     */
    onPageSizeChange?: (pageSize: TableRowsPerPageKey) => void;
};

const getVisiblePages = (currentPage: number, totalPages: number) => {
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
        return [1, 2, 3, "ellipsis", totalPages];
    }

    if (currentPage >= totalPages - 2) {
        return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
};

const TablePagination = ({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
}: TablePaginationProps) => {
    if (totalItems <= 0) {
        return null;
    }

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    const visiblePages = getVisiblePages(currentPage, totalPages);

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Visualizzati {startItem}-{endItem} di {totalItems}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {onPageSizeChange ? (
                    <RowsPerPageSelect value={pageSize as TableRowsPerPageKey} onValueChange={onPageSizeChange} />
                ) : null}

                {totalPages <= 1 ? null : (
                    // `w-auto` annulla il `w-full` di default di Pagination: qui sta accanto al
                    // selettore, e a piena larghezza andrebbe a capo su una riga tutta sua.
                    <Pagination className="mx-0 w-auto">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    aria-disabled={currentPage === 1}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        if (currentPage > 1) {
                                            onPageChange(currentPage - 1);
                                        }
                                    }}
                                />
                            </PaginationItem>

                            {visiblePages.map((page, index) => {
                                if (typeof page === "string") {
                                    return (
                                        <PaginationItem key={`ellipsis-${index}`}>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    );
                                }

                                return (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            href="#"
                                            isActive={page === currentPage}
                                            onClick={(event) => {
                                                event.preventDefault();
                                                onPageChange(page);
                                            }}
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            })}

                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    aria-disabled={currentPage === totalPages}
                                    className={
                                        currentPage === totalPages ? "pointer-events-none opacity-50" : undefined
                                    }
                                    onClick={(event) => {
                                        event.preventDefault();
                                        if (currentPage < totalPages) {
                                            onPageChange(currentPage + 1);
                                        }
                                    }}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </div>
        </div>
    );
};

export default TablePagination;
