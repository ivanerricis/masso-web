import DateRangeFilter from "@/components/filters/date-range-filter";
import FilterSelect from "@/components/filters/filter-select";
import SearchInput from "@/components/search-input";
import { ArrowUpDown, ListFilter } from "lucide-react";
import { reportSortOptions, type ReportSortOption, type ReportVisibilityFilter } from "./types";

// La visibilità non ha un elenco di opzioni altrove: "aperti"/"chiusi" derivano dal
// booleano `closed` del report, non da una colonna con valori propri.
const reportVisibilityOptions: { value: ReportVisibilityFilter; label: string }[] = [
    { value: "open", label: "Report aperti" },
    { value: "closed", label: "Report chiusi" },
];

type ReportsFiltersProps = {
    searchText: string;
    onSearchTextChange: (value: string) => void;
    visibilityFilter: ReportVisibilityFilter;
    onVisibilityFilterChange: (value: ReportVisibilityFilter) => void;
    sortOption: ReportSortOption;
    onSortOptionChange: (value: ReportSortOption) => void;
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
    sortOption,
    onSortOptionChange,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
}: ReportsFiltersProps) => {
    return (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <SearchInput value={searchText} onValueChange={onSearchTextChange} placeholder="Cerca report..." />

            <FilterSelect
                value={visibilityFilter}
                onValueChange={onVisibilityFilterChange}
                options={reportVisibilityOptions}
                allOption={{ value: "all", label: "Tutti i report" }}
                label="Filtra per stato"
                icon={ListFilter}
            />

            <FilterSelect
                value={sortOption}
                onValueChange={onSortOptionChange}
                options={reportSortOptions}
                label="Ordina per"
                icon={ArrowUpDown}
            />

            <DateRangeFilter
                dateFrom={dateFrom}
                onDateFromChange={onDateFromChange}
                dateTo={dateTo}
                onDateToChange={onDateToChange}
            />
        </div>
    );
};

export default ReportsFilters;
