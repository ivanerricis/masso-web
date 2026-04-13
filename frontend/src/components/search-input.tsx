import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";

const SearchInput = () => {
    return (
        <InputGroup className="w-60">
            <InputGroupAddon>
                <Search className="size-5 text-primary" />
            </InputGroupAddon>
            <InputGroupInput placeholder="Cerca..." />
        </InputGroup>
    );
};

export default SearchInput;