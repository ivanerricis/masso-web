export type ThemeAccentPresetKey = "default" | "ocean" | "forest" | "amber" | "rose";

export type ThemeAccentPreset = {
    key: ThemeAccentPresetKey;
    label: string;
    description: string;
    primary: string;
    primaryForeground: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    ring: string;
    chart1: string;
    chart2: string;
    chart3: string;
    chart4: string;
    chart5: string;
};

const accentStorageKey = "masso-web-theme-accent";

export const themeAccentPresets: ThemeAccentPreset[] = [
    {
        key: "default",
        label: "Predefinito",
        description: "Mantiene il blu attuale dell'app.",
        primary: "#2A75B9",
        primaryForeground: "oklch(0.977 0.013 236.62)",
        sidebarPrimary: "#2A75B9",
        sidebarPrimaryForeground: "oklch(0.977 0.013 236.62)",
        ring: "oklch(0.705 0.015 286.067)",
        chart1: "oklch(0.78 0.16 84)",
        chart2: "oklch(0.72 0.18 152)",
        chart3: "oklch(0.68 0.16 32)",
        chart4: "oklch(0.64 0.15 195)",
        chart5: "oklch(0.58 0.14 18)",
    },
    {
        key: "ocean",
        label: "Oceano",
        description: "Toni più freddi e tecnici.",
        primary: "#0F766E",
        primaryForeground: "oklch(0.985 0 0)",
        sidebarPrimary: "#0F766E",
        sidebarPrimaryForeground: "oklch(0.985 0 0)",
        ring: "oklch(0.72 0.14 182)",
        chart1: "oklch(0.72 0.18 182)",
        chart2: "oklch(0.68 0.16 152)",
        chart3: "oklch(0.68 0.14 210)",
        chart4: "oklch(0.64 0.12 250)",
        chart5: "oklch(0.58 0.12 190)",
    },
    {
        key: "forest",
        label: "Bosco",
        description: "Verde professionale e pulito.",
        primary: "#2F855A",
        primaryForeground: "oklch(0.985 0 0)",
        sidebarPrimary: "#2F855A",
        sidebarPrimaryForeground: "oklch(0.985 0 0)",
        ring: "oklch(0.72 0.14 145)",
        chart1: "oklch(0.72 0.18 145)",
        chart2: "oklch(0.68 0.14 165)",
        chart3: "oklch(0.66 0.12 110)",
        chart4: "oklch(0.64 0.12 75)",
        chart5: "oklch(0.58 0.12 135)",
    },
    {
        key: "amber",
        label: "Ambra",
        description: "Caldo e molto visibile.",
        primary: "#B7791F",
        primaryForeground: "oklch(0.985 0 0)",
        sidebarPrimary: "#B7791F",
        sidebarPrimaryForeground: "oklch(0.985 0 0)",
        ring: "oklch(0.76 0.16 80)",
        chart1: "oklch(0.76 0.16 80)",
        chart2: "oklch(0.72 0.17 45)",
        chart3: "oklch(0.68 0.12 100)",
        chart4: "oklch(0.64 0.14 20)",
        chart5: "oklch(0.58 0.11 55)",
    },
    {
        key: "rose",
        label: "Rosa",
        description: "Accento deciso per il laboratorio.",
        primary: "#C05678",
        primaryForeground: "oklch(0.985 0 0)",
        sidebarPrimary: "#C05678",
        sidebarPrimaryForeground: "oklch(0.985 0 0)",
        ring: "oklch(0.7 0.16 350)",
        chart1: "oklch(0.7 0.16 350)",
        chart2: "oklch(0.66 0.14 20)",
        chart3: "oklch(0.62 0.12 320)",
        chart4: "oklch(0.6 0.12 30)",
        chart5: "oklch(0.56 0.1 355)",
    },
];

const getThemeRoot = () => document.documentElement;

export const getStoredThemeAccentPreset = () => {
    const storedValue = localStorage.getItem(accentStorageKey) as ThemeAccentPresetKey | null;

    return themeAccentPresets.some((preset) => preset.key === storedValue) ? storedValue : null;
};

export const setStoredThemeAccentPreset = (presetKey: ThemeAccentPresetKey | null) => {
    if (!presetKey || presetKey === "default") {
        localStorage.removeItem(accentStorageKey);
        return;
    }

    localStorage.setItem(accentStorageKey, presetKey);
};

export const applyThemeAccentPreset = (presetKey: ThemeAccentPresetKey | null) => {
    const root = getThemeRoot();

    if (!presetKey || presetKey === "default") {
        root.style.removeProperty("--primary");
        root.style.removeProperty("--primary-foreground");
        root.style.removeProperty("--sidebar-primary");
        root.style.removeProperty("--sidebar-primary-foreground");
        root.style.removeProperty("--ring");
        root.style.removeProperty("--chart-1");
        root.style.removeProperty("--chart-2");
        root.style.removeProperty("--chart-3");
        root.style.removeProperty("--chart-4");
        root.style.removeProperty("--chart-5");
        return;
    }

    const preset = themeAccentPresets.find((item) => item.key === presetKey);

    if (!preset) {
        return;
    }

    root.style.setProperty("--primary", preset.primary);
    root.style.setProperty("--primary-foreground", preset.primaryForeground);
    root.style.setProperty("--sidebar-primary", preset.sidebarPrimary);
    root.style.setProperty("--sidebar-primary-foreground", preset.sidebarPrimaryForeground);
    root.style.setProperty("--ring", preset.ring);
    root.style.setProperty("--chart-1", preset.chart1);
    root.style.setProperty("--chart-2", preset.chart2);
    root.style.setProperty("--chart-3", preset.chart3);
    root.style.setProperty("--chart-4", preset.chart4);
    root.style.setProperty("--chart-5", preset.chart5);
};