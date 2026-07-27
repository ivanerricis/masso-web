import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type EntityCardColumn<T> = {
    key: string;
    header: string;
    render: (row: T) => ReactNode;
};

type EntityCardListProps<T> = {
    className?: string;
    columns: EntityCardColumn<T>[];
    rows: T[];
    getRowKey: (row: T) => React.Key;
    /** Color classes for the card's top accent border (e.g. "border-t-green-500"), not a full background. */
    getAccentClassName?: (row: T) => string;
    renderActions?: (row: T) => ReactNode;
    emptyMessage: string;
};

const EntityCardList = <T,>({
    className,
    columns,
    rows,
    getRowKey,
    getAccentClassName,
    renderActions,
    emptyMessage,
}: EntityCardListProps<T>) => {
    if (rows.length === 0) {
        return (
            <div className={cn("sm:hidden py-6 text-center text-sm text-muted-foreground", className)}>
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col gap-3 sm:hidden", className)}>
            {rows.map((row) => (
                <div
                    key={getRowKey(row)}
                    className={cn("rounded-lg border border-t-4 bg-background p-3", getAccentClassName?.(row))}
                >
                    <dl className="flex flex-col gap-1.5">
                        {columns.map((column) => (
                            <div key={column.key} className="flex items-baseline justify-between gap-3 text-sm">
                                <dt className="text-muted-foreground">{column.header}</dt>
                                <dd className="text-right font-medium break-words">{column.render(row)}</dd>
                            </div>
                        ))}
                    </dl>
                    {renderActions ? (
                        <div className="mt-3 flex items-center justify-end gap-2 border-t pt-3">
                            {renderActions(row)}
                        </div>
                    ) : null}
                </div>
            ))}
        </div>
    );
};

export default EntityCardList;
