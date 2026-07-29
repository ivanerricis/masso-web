import { useEffect, useState } from "react";
import { Computer, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsCard, SettingsSection } from "@/components/settings/settingsUi";
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

// Stessa resa dei pulsanti di navigazione della pagina Impostazioni: riquadro con icona,
// titolo e descrizione, bordo evidenziato quando la voce è quella attiva.
const optionButtonClasses = (isActive: boolean) =>
    cn(
        "h-auto items-start justify-start gap-2 rounded-xl border p-3 text-left",
        isActive && "border-primary bg-primary/10 dark:border-primary dark:bg-primary/10"
    );

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
        <SettingsSection>
            <SettingsCard title="Modalità" description="Scegli se seguire il sistema oppure forzare il tema chiaro o scuro.">
                <div className="grid gap-2 sm:grid-cols-3">
                    {modeOptions.map((option) => {
                        const Icon = option.icon;

                        return (
                            <Button
                                key={option.value}
                                type="button"
                                variant="outline"
                                className={optionButtonClasses(theme === option.value)}
                                onClick={() => setTheme(option.value)}
                            >
                                <Icon className="mt-0.5 size-4 shrink-0" />
                                <span className="grid gap-0.5">
                                    <span className="text-sm font-semibold">{option.label}</span>
                                    <span className="text-xs font-normal text-muted-foreground">
                                        {option.description}
                                    </span>
                                </span>
                            </Button>
                        );
                    })}
                </div>
            </SettingsCard>

            <SettingsCard title="Colore principale" description="Palette usata per pulsanti, sidebar e accenti dell'applicazione.">
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {themeAccentPresets.map((preset) => (
                        <Button
                            key={preset.key}
                            type="button"
                            variant="outline"
                            className={optionButtonClasses(selectedAccent === preset.key)}
                            onClick={() => handleSelectAccent(preset.key)}
                        >
                            <span
                                className="mt-0.5 size-4 shrink-0 rounded-full border border-border"
                                style={{ backgroundColor: preset.primary }}
                            />
                            <span className="grid gap-0.5">
                                <span className="text-sm font-semibold">{preset.label}</span>
                                <span className="text-xs font-normal text-muted-foreground">{preset.description}</span>
                            </span>
                        </Button>
                    ))}
                </div>
            </SettingsCard>
        </SettingsSection>
    );
};

export default ThemeSettingsSection;
