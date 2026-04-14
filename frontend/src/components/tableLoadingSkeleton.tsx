import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type TableLoadingSkeletonProps = {
    columns: number;
    rows?: number;
};

const TableLoadingSkeleton = ({ columns, rows = 6 }: TableLoadingSkeletonProps) => {
    return (
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
    );
};

export default TableLoadingSkeleton;
