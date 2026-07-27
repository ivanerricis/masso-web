import SearchInput from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { FilterX, ListFilter } from "lucide-react";
import type { ReportVisibilityFilter } from "./types";

const COMPACT_BREAKPOINT = 640;

type ReportsFiltersProps = {
    searchText: string;
    onSearchTextChange: (value: string) => void;
    visibilityFilter: ReportVisibilityFilter;
    onVisibilityFilterChange: (value: ReportVisibilityFilter) => void;
    dateFrom: string | undefined;
    onDateFromChange: (value: string | undefined) => void;
    dateTo: string | undefined;
    onDateToChange: (value: string | undefined) => void;
};

const ReportsFilters = ({
    searchText,
    onSearchTextChange,
    visibilityFilter,
    onVisibilityFilterChange,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
}: ReportsFiltersProps) => {
    const isCompact = useIsMobile(COMPACT_BREAKPOINT);

    const handleClearDates = () => {
        onDateFromChange(undefined);
        onDateToChange(undefined);
    };

    return (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <SearchInput value={searchText} onValueChange={onSearchTextChange} placeholder="Cerca rapporto..." />
            <Select value={visibilityFilter} onValueChange={(value) => onVisibilityFilterChange(value as ReportVisibilityFilter)}>
                <SelectTrigger className={isCompact ? "w-auto px-2" : "w-56"} aria-label="Filtra per stato">
                    {isCompact ? <ListFilter className="size-4" /> : <SelectValue placeholder="Filtra per stato" />}
                </SelectTrigger>
                <SelectContent position="popper">
                    <SelectItem value="all">Tutti i rapportini</SelectItem>
                    <SelectItem value="open">Rapportini aperti</SelectItem>
                    <SelectItem value="closed">Rapportini chiusi</SelectItem>
                </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
                <Input
                    type="date"
                    aria-label="Data di inizio"
                    value={dateFrom ?? ""}
                    max={dateTo}
                    onChange={(event) => onDateFromChange(event.target.value || undefined)}
                    className="w-36 sm:w-40"
                />
                <span className="text-sm text-muted-foreground">-</span>
                <Input
                    type="date"
                    aria-label="Data di fine"
                    value={dateTo ?? ""}
                    min={dateFrom}
                    onChange={(event) => onDateToChange(event.target.value || undefined)}
                    className="w-36 sm:w-40"
                />
            </div>

            {dateFrom || dateTo ? (
                <Button
                    variant="ghost"
                    className="gap-2 px-2 sm:ml-auto sm:px-4"
                    onClick={handleClearDates}
                    aria-label="Pulisci date"
                >
                    <FilterX className="size-4" />
                    <span className="hidden sm:inline">Pulisci date</span>
                </Button>
            ) : null}
        </div>
    );
};

export default ReportsFilters;
