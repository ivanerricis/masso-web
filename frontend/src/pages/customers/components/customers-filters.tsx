import FilterSelect from "@/components/filters/filter-select";
import SearchInput from "@/components/search-input";
import { ArrowUpDown } from "lucide-react";
import { customerSortOptions, type CustomerSortOption } from "./types";

type CustomersFiltersProps = {
    searchText: string;
    onSearchTextChange: (value: string) => void;
    sortOption: CustomerSortOption;
    onSortOptionChange: (value: CustomerSortOption) => void;
};

const CustomersFilters = ({
    searchText,
    onSearchTextChange,
    sortOption,
    onSortOptionChange,
}: CustomersFiltersProps) => {
    return (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <SearchInput value={searchText} onValueChange={onSearchTextChange} placeholder="Cerca cliente..." />

            <FilterSelect
                value={sortOption}
                onValueChange={onSortOptionChange}
                options={customerSortOptions}
                label="Ordina per"
                icon={ArrowUpDown}
            />
        </div>
    );
};

export default CustomersFilters;
