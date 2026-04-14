import SearchInput from "@/components/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReportVisibilityFilter } from "./types";

type ReportsFiltersProps = {
    searchText: string;
    onSearchTextChange: (value: string) => void;
    visibilityFilter: ReportVisibilityFilter;
    onVisibilityFilterChange: (value: ReportVisibilityFilter) => void;
};

const ReportsFilters = ({
    searchText,
    onSearchTextChange,
    visibilityFilter,
    onVisibilityFilterChange,
}: ReportsFiltersProps) => {
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
        </div>
    );
};

export default ReportsFilters;
