import SearchInput from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { interventionTypeOptions, interventionStatusOptions } from "@/lib/interventions";
import { FilterX } from "lucide-react";
import type { InterventionStatusFilter, InterventionTypeFilter } from "./types";

type InterventionsFiltersProps = {
    searchText: string;
    onSearchTextChange: (value: string) => void;
    statusFilter: InterventionStatusFilter;
    onStatusFilterChange: (value: InterventionStatusFilter) => void;
    typeFilter: InterventionTypeFilter;
    onTypeFilterChange: (value: InterventionTypeFilter) => void;
    dateFrom: string | undefined;
    onDateFromChange: (value: string | undefined) => void;
    dateTo: string | undefined;
    onDateToChange: (value: string | undefined) => void;
};

const InterventionsFilters = ({
    searchText,
    onSearchTextChange,
    statusFilter,
    onStatusFilterChange,
    typeFilter,
    onTypeFilterChange,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
}: InterventionsFiltersProps) => {
    const handleClearDates = () => {
        onDateFromChange(undefined);
        onDateToChange(undefined);
    };

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <SearchInput value={searchText} onValueChange={onSearchTextChange} placeholder="Cerca intervento..." />

            <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as InterventionStatusFilter)}>
                <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Filtra per stato" />
                </SelectTrigger>
                <SelectContent position="popper">
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    {interventionStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value) => onTypeFilterChange(value as InterventionTypeFilter)}>
                <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Filtra per tipo" />
                </SelectTrigger>
                <SelectContent position="popper">
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    {interventionTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
                <Input
                    type="date"
                    aria-label="Data di inizio"
                    value={dateFrom ?? ""}
                    max={dateTo}
                    onChange={(event) => onDateFromChange(event.target.value || undefined)}
                    className="w-full sm:w-40"
                />
                <span className="text-sm text-muted-foreground">-</span>
                <Input
                    type="date"
                    aria-label="Data di fine"
                    value={dateTo ?? ""}
                    min={dateFrom}
                    onChange={(event) => onDateToChange(event.target.value || undefined)}
                    className="w-full sm:w-40"
                />
            </div>

            {dateFrom || dateTo ? (
                <Button
                    variant="ghost"
                    className="w-full gap-2 sm:w-auto sm:ml-auto"
                    onClick={handleClearDates}
                >
                    <FilterX className="size-4" />
                    Pulisci date
                </Button>
            ) : null}
        </div>
    );
};

export default InterventionsFilters;
