import SearchInput from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { interventionTypeOptions, interventionStatusOptions } from "@/lib/interventions";
import { CalendarDays, FilterX } from "lucide-react";
import type { InterventionStatusFilter, InterventionTypeFilter } from "./types";

type InterventionsFiltersProps = {
    searchText: string;
    onSearchTextChange: (value: string) => void;
    statusFilter: InterventionStatusFilter;
    onStatusFilterChange: (value: InterventionStatusFilter) => void;
    typeFilter: InterventionTypeFilter;
    onTypeFilterChange: (value: InterventionTypeFilter) => void;
    selectedDate: Date | undefined;
    onSelectedDateChange: (value: Date | undefined) => void;
};

const InterventionsFilters = ({
    searchText,
    onSearchTextChange,
    statusFilter,
    onStatusFilterChange,
    typeFilter,
    onTypeFilterChange,
    selectedDate,
    onSelectedDateChange,
}: InterventionsFiltersProps) => {
    const selectedDateLabel = selectedDate
        ? new Intl.DateTimeFormat("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(selectedDate)
        : "Filtra per data";

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

export default InterventionsFilters;
