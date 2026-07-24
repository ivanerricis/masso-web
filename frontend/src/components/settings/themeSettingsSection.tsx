import { useEffect, useState } from "react";
import { Computer, Moon, Palette, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/use-theme";
import {
    applyThemeAccentPreset,
    getStoredThemeAccentPreset,
    setStoredThemeAccentPreset,
    themeAccentPresets,
    type ThemeAccentPresetKey,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

type ModeOption = {
    value: "light" | "dark" | "system";
    label: string;
    description: string;
    icon: typeof Sun;
};

const modeOptions: ModeOption[] = [
    { value: "light", label: "Chiaro", description: "Interfaccia luminosa e pulita.", icon: Sun },
    { value: "dark", label: "Scuro", description: "Interfaccia più riposante.", icon: Moon },
    { value: "system", label: "Sistema", description: "Segue le impostazioni del sistema.", icon: Computer },
];

const ThemeSettingsSection = () => {
    const { theme, setTheme } = useTheme();
    const [selectedAccent, setSelectedAccent] = useState<ThemeAccentPresetKey>(() =>
        getStoredThemeAccentPreset() ?? "default"
    );

    useEffect(() => {
        applyThemeAccentPreset(selectedAccent);
    }, [selectedAccent]);

    const handleSelectAccent = (presetKey: ThemeAccentPresetKey) => {
        setSelectedAccent(presetKey);
        setStoredThemeAccentPreset(presetKey);
        applyThemeAccentPreset(presetKey);
    };

    return (
        <div className="grid gap-4">
            <Card className="border-primary/15 shadow-sm">
                <CardHeader className="border-b border-primary/10 bg-muted/20">
                    <CardTitle>Aspetto</CardTitle>
                    <CardDescription>Imposta il modo grafico e i colori principali dell'applicazione.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pt-6">
                    <div className="grid gap-3 md:grid-cols-3">
                        {modeOptions.map((option) => {
                            const Icon = option.icon;
                            const isActive = theme === option.value;

                            return (
                                <Button
                                    key={option.value}
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        "h-auto items-start justify-start gap-3 rounded-xl border p-4 text-left",
                                        isActive && "border-primary bg-primary/10 dark:border-primary dark:bg-primary/10"
                                    )}
                                    onClick={() => setTheme(option.value)}
                                >
                                    <Icon className="mt-0.5 size-5 shrink-0" />
                                    <span className="grid gap-1">
                                        <span className="font-semibold">{option.label}</span>
                                        <span className="text-sm font-normal text-muted-foreground">{option.description}</span>
                                    </span>
                                </Button>
                            );
                        })}
                    </div>

                    <div className="grid gap-3">
                        <div className="flex items-center gap-2">
                            <Palette className="size-5 text-primary" />
                            <div>
                                <p className="font-semibold">Colore principale</p>
                                <p className="text-sm text-muted-foreground">Scegli una palette per pulsanti, sidebar e accenti.</p>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {themeAccentPresets.map((preset) => {
                                const isActive = selectedAccent === preset.key;

                                return (
                                    <Button
                                        key={preset.key}
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            "h-auto items-start justify-start gap-3 rounded-xl border p-4 text-left",
                                            isActive && "border-primary bg-primary/10 dark:border-primary dark:bg-primary/10"
                                        )}
                                        onClick={() => handleSelectAccent(preset.key)}
                                    >
                                        <span
                                            className="mt-0.5 size-4 shrink-0 rounded-full border border-border"
                                            style={{ backgroundColor: preset.primary }}
                                        />
                                        <span className="grid gap-1">
                                            <span className="font-semibold">{preset.label}</span>
                                            <span className="text-sm font-normal text-muted-foreground">{preset.description}</span>
                                        </span>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ThemeSettingsSection;