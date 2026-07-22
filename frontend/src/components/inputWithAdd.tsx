import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type Props = Readonly<{
    id: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    options?: string[];
    onSearch?: (query: string) => Promise<string[]>;
    onCreate?: (value: string) => Promise<void> | void;
    required?: boolean;
    inputClassName?: string;
}>;

const InputWithAdd = ({ id, placeholder, value, onChange, options = [], onSearch, onCreate, required, inputClassName }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const debouncedValue = useDebouncedValue(value, 250);

    const normalizedValue = value.trim().toLowerCase();

    useEffect(() => {
        if (!onSearch) {
            return;
        }

        let isCancelled = false;

        const runSearch = async () => {
            const results = await onSearch(debouncedValue.trim());

            if (!isCancelled) {
                setSearchResults(results);
            }
        };

        void runSearch();

        return () => {
            isCancelled = true;
        };
    }, [onSearch, debouncedValue]);

    const filteredOptions = useMemo(() => {
        if (onSearch) {
            return searchResults;
        }

        if (normalizedValue.length === 0) {
            return options.slice(0, 8);
        }

        return options
            .filter((option) => option.toLowerCase().includes(normalizedValue))
            .slice(0, 8);
    }, [onSearch, searchResults, normalizedValue, options]);

    const hasExactMatch = useMemo(() => {
        if (!normalizedValue) {
            return false;
        }

        return options.some((option) => option.toLowerCase() === normalizedValue);
    }, [normalizedValue, options]);

    const canCreate = !onSearch && normalizedValue.length > 0 && !hasExactMatch;

    const handleCreate = async () => {
        const trimmed = value.trim();
        if (!trimmed) {
            return;
        }

        if (!onCreate) {
            setIsOpen(false);
            return;
        }

        try {
            setIsCreating(true);
            await onCreate(trimmed);
            onChange(trimmed);
            setIsOpen(false);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="relative w-full">
            <Input
                className={cn("group text-lg! h-full", inputClassName)}
                id={id}
                placeholder={placeholder}
                value={value}
                onFocus={() => setIsOpen(true)}
                onBlur={() => {
                    setTimeout(() => setIsOpen(false), 100);
                }}
                onChange={(event) => {
                    onChange(event.target.value);
                    setIsOpen(true);
                }}
                required={required}
            />

            {isOpen ? (
                <div className="absolute z-10 mt-2 w-full rounded-md border bg-background shadow-sm">
                    <div className="max-h-48 overflow-auto">
                        {filteredOptions.map((option) => (
                            <Button
                                key={option}
                                type="button"
                                variant="ghost"
                                size={"lg"}
                                className="w-full justify-start rounded-sm"
                                onMouseDown={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                            >
                                {option}
                            </Button>
                        ))}
                    </div>

                    {canCreate ? (
                        <Button
                            type="button"
                            size="lg"
                            className="w-full rounded-sm"
                            onMouseDown={() => {
                                void handleCreate();
                            }}
                            disabled={isCreating}
                        >
                            <Plus className="size-5"/>
                            {isCreating
                                ? "Creazione..."
                                : onCreate
                                    ? `Crea "${value.trim()}"`
                                    : `Usa "${value.trim()}"`}
                        </Button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

export default InputWithAdd;