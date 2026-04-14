import SearchInput from "@/components/search-input";

type TechniciansFiltersProps = {
    searchText: string;
    onSearchTextChange: (value: string) => void;
};

const TechniciansFilters = ({ searchText, onSearchTextChange }: TechniciansFiltersProps) => {
    return <SearchInput value={searchText} onValueChange={onSearchTextChange} placeholder="Cerca tecnico..." />;
};

export default TechniciansFilters;
