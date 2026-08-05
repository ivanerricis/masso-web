import { useEffect, useState } from "react";
import {
    applyCornerRadius,
    applyFontSize,
    applyTableDensity,
    applyTableRowIntensity,
    applyThemeAccentPreset,
    getStoredCornerRadius,
    getStoredFontSize,
    getStoredTableDensity,
    getStoredTableRowIntensity,
    getStoredThemeAccentPreset,
} from "@/lib/theme";
import { ThemeProviderContext, type Theme } from "@/components/theme-provider-context";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(storageKey) as Theme) || defaultTheme);

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove("light", "dark");

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }

        applyThemeAccentPreset(getStoredThemeAccentPreset());
        applyTableRowIntensity(getStoredTableRowIntensity());
        applyTableDensity(getStoredTableDensity());
        applyFontSize(getStoredFontSize());
        applyCornerRadius(getStoredCornerRadius());
    }, [theme]);

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme);
            setTheme(theme);
        },
    };

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}
