import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type TableLoadingSkeletonProps = {
    columns: number;
    rows?: number;
};

const TableLoadingSkeleton = ({ columns, rows = 6 }: TableLoadingSkeletonProps) => {
    return (
        <>
        <Table className="hidden sm:table bg-background">
            <TableHeader className="w-full">
                <TableRow>
                    {Array.from({ length: columns }).map((_, columnIndex) => (
                        <TableHead key={`skeleton-head-${columnIndex}`}>
                            <Skeleton className="h-4 w-20" />
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <TableRow key={`skeleton-row-${rowIndex}`}>
                        {Array.from({ length: columns }).map((_, columnIndex) => (
                            <TableCell key={`skeleton-cell-${rowIndex}-${columnIndex}`}>
                                <Skeleton className="h-5 w-full max-w-35" />
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>

        <div className="flex flex-col gap-3 sm:hidden">
            {Array.from({ length: Math.min(rows, 4) }).map((_, cardIndex) => (
                <div key={`skeleton-card-${cardIndex}`} className="rounded-lg border bg-background p-3">
                    <div className="flex flex-col gap-2">
                        {Array.from({ length: Math.min(columns, 5) }).map((_, lineIndex) => (
                            <div key={`skeleton-card-${cardIndex}-line-${lineIndex}`} className="flex items-center justify-between gap-3">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
        </>
    );
};

export default TableLoadingSkeleton;
