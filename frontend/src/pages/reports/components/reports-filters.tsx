import SearchInput from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, FilterX } from "lucide-react";
import type { ReportVisibilityFilter } from "./types";

type ReportsFiltersProps = {
    searchText: string;
    onSearchTextChange: (value: string) => void;
    visibilityFilter: ReportVisibilityFilter;
    onVisibilityFilterChange: (value: ReportVisibilityFilter) => void;
    selectedDate: Date | undefined;
    onSelectedDateChange: (value: Date | undefined) => void;
};

const ReportsFilters = ({
    searchText,
    onSearchTextChange,
    visibilityFilter,
    onVisibilityFilterChange,
    selectedDate,
    onSelectedDateChange,
}: ReportsFiltersProps) => {
    const selectedDateLabel = selectedDate
        ? new Intl.DateTimeFormat("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(selectedDate)
        : "Filtra per data";

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput value={searchText} onValueChange={onSearchTextChange} placeholder="Cerca rapporto..." />
            <Select value={visibilityFilter} onValueChange={(value) => onVisibilityFilterChange(value as ReportVisibilityFilter)}>
                <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Filtra per stato" />
                </SelectTrigger>
                <SelectContent position="popper">
                    <SelectItem value="all">Tutti i rapportini</SelectItem>
                    <SelectItem value="open">Rapportini aperti</SelectItem>
                    <SelectItem value="closed">Rapportini chiusi</SelectItem>
                </SelectContent>
            </Select>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2 sm:w-56">
                        <CalendarDays className="size-4" />
                        <span className="truncate">{selectedDateLabel}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={onSelectedDateChange}
                        className="rounded-md border"
                    />
                </DropdownMenuContent>
            </DropdownMenu>

            {selectedDate ? (
                <Button
                    variant="ghost"
                    className="w-full gap-2 sm:w-auto"
                    onClick={() => onSelectedDateChange(undefined)}
                >
                    <FilterX className="size-4" />
                    Pulisci data
                </Button>
            ) : null}
        </div>
    );
};

export default ReportsFilters;
