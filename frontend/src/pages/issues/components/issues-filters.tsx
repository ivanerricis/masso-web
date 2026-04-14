import SearchInput from "@/components/search-input";

type IssuesFiltersProps = {
    searchText: string;
    onSearchTextChange: (value: string) => void;
};

const IssuesFilters = ({ searchText, onSearchTextChange }: IssuesFiltersProps) => {
    return <SearchInput value={searchText} onValueChange={onSearchTextChange} placeholder="Cerca difetto..." />;
};

export default IssuesFilters;
