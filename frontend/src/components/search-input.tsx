import { Search, X } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./ui/input-group";

type Props = {
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
};

const SearchInput = ({ value, onValueChange, placeholder = "Cerca..." }: Props) => {
    const handleDeleteText = () => {
        onValueChange("");
    };

    return (
        <InputGroup className="w-60 border-primary!">
            <InputGroupAddon>
                <Search className="size-5 text-primary" />
            </InputGroupAddon>
            <InputGroupInput
                placeholder={placeholder}
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
            />
            <InputGroupButton
                className="mr-1"
                size={"icon-sm"}
                onClick={handleDeleteText}
            >
                <X className="text-primary" />
            </InputGroupButton>
        </InputGroup>
    );
};

export default SearchInput;