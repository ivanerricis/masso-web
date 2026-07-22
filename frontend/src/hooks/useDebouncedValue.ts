import { useEffect, useState } from "react";

export const useDebouncedValue = <T>(value: T, delayMs = 300) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);

        return () => clearTimeout(timeoutId);
    }, [value, delayMs]);

    return debouncedValue;
};
