import { useState } from "react";
import { Database, Image, Palette, RefreshCw } from "lucide-react";
import BackupSettingsPanel from "@/components/dialogs/settings/backupSettingsPanel";
import LogoSettingsPanel from "@/components/dialogs/settings/logoSettingsPanel";
import UpdateSettingsPanel from "@/components/dialogs/settings/updateSettingsPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ThemeSettingsSection from "@/components/settings/themeSettingsSection";

type SettingsSectionKey = "theme" | "logo" | "backup" | "update";

const settingsSections: Array<{
    key: SettingsSectionKey;
    label: string;
    description: string;
    icon: typeof Palette;
}> = [
    {
        key: "theme",
        label: "Tema",
        description: "Colori, modalità e accenti visivi",
        icon: Palette,
    },
    {
        key: "logo",
        label: "Logo",
        description: "Logo del laboratorio su app e report",
        icon: Image,
    },
    {
        key: "backup",
        label: "Backup",
        description: "Dump manuale e automazione",
        icon: Database,
    },
    {
        key: "update",
        label: "Aggiornamenti",
        description: "Verifica e aggiorna l'applicazione",
        icon: RefreshCw,
    },
];

const SettingsPage = () => {
    const [activeSection, setActiveSection] = useState<SettingsSectionKey>("theme");

    return (
        <div className="flex h-full min-h-0 w-full gap-4">
            <aside className="flex w-full max-w-xs shrink-0 flex-col gap-4 overflow-y-auto rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm">

                <div className="grid gap-2">
                    {settingsSections.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.key;

                        return (
                            <Button
                                key={section.key}
                                type="button"
                                variant="outline"
                                onClick={() => setActiveSection(section.key)}
                                className={cn(
                                    "h-auto items-start justify-start gap-3 rounded-xl border p-4 text-left",
                                    isActive && "border-primary bg-primary/10"
                                )}
                            >
                                <Icon className="mt-0.5 size-5 shrink-0" />
                                <span className="grid gap-1">
                                    <span className="font-semibold">{section.label}</span>
                                    <span className="text-sm font-normal text-muted-foreground">{section.description}</span>
                                </span>
                            </Button>
                        );
                    })}
                </div>

                <Card className="border-dashed border-primary/20 bg-muted/25 shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Prossime sezioni</CardTitle>
                        <CardDescription>Qui potrai aggiungere nuove aree di configurazione.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        La struttura è già pronta per ospitare altre impostazioni senza cambiare layout.
                    </CardContent>
                </Card>
            </aside>

            <section className="min-w-0 flex-1 overflow-y-auto rounded-2xl border bg-background/90 p-4 shadow-sm backdrop-blur-sm md:p-6">
                {activeSection === "theme" ? (
                    <ThemeSettingsSection />
                ) : activeSection === "logo" ? (
                    <LogoSettingsPanel />
                ) : activeSection === "backup" ? (
                    <BackupSettingsPanel />
                ) : (
                    <UpdateSettingsPanel />
                )}
            </section>
        </div>
    );
};

export default SettingsPage;