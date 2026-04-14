import SearchInput from "@/components/search-input";

type CollaboratorsFiltersProps = {
    searchText: string;
    onSearchTextChange: (value: string) => void;
};

const CollaboratorsFilters = ({ searchText, onSearchTextChange }: CollaboratorsFiltersProps) => {
    return <SearchInput value={searchText} onValueChange={onSearchTextChange} placeholder="Cerca collaboratore..." />;
};

export default CollaboratorsFilters;
