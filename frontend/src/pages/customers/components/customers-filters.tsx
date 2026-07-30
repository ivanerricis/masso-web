import SearchInput from "@/components/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowUpDown } from "lucide-react";
import { customerSortOptions, type CustomerSortOption } from "./types";

const COMPACT_BREAKPOINT = 640;

type CustomersFiltersProps = {
    searchText: string;
    onSearchTextChange: (value: string) => void;
    sortOption: CustomerSortOption;
    onSortOptionChange: (value: CustomerSortOption) => void;
};

const CustomersFilters = ({ searchText, onSearchTextChange, sortOption, onSortOptionChange }: CustomersFiltersProps) => {
    const isCompact = useIsMobile(COMPACT_BREAKPOINT);

    return (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <SearchInput value={searchText} onValueChange={onSearchTextChange} placeholder="Cerca cliente..." />

            <Select value={sortOption} onValueChange={(value) => onSortOptionChange(value as CustomerSortOption)}>
                <SelectTrigger className={isCompact ? "w-auto px-2" : "w-56"} aria-label="Ordina per">
                    {isCompact ? <ArrowUpDown className="size-4" /> : <SelectValue placeholder="Ordina per" />}
                </SelectTrigger>
                <SelectContent position="popper">
                    {customerSortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default CustomersFilters;
