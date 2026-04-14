import SearchInput from "@/components/search-input";

type DevicesFiltersProps = {
    searchText: string;
    onSearchTextChange: (value: string) => void;
};

const DevicesFilters = ({ searchText, onSearchTextChange }: DevicesFiltersProps) => {
    return <SearchInput value={searchText} onValueChange={onSearchTextChange} placeholder="Cerca dispositivo..." />;
};

export default DevicesFilters;
