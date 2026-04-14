import SearchInput from "@/components/search-input";

type CustomersFiltersProps = {
    searchText: string;
    onSearchTextChange: (value: string) => void;
};

const CustomersFilters = ({ searchText, onSearchTextChange }: CustomersFiltersProps) => {
    return <SearchInput value={searchText} onValueChange={onSearchTextChange} placeholder="Cerca cliente..." />;
};

export default CustomersFilters;
