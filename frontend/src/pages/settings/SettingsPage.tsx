import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Database, Image, Mail, Palette, RefreshCw, ScrollText, Users } from "lucide-react";
import BackupSettingsPanel from "@/components/dialogs/settings/backupSettingsPanel";
import EmailSettingsPanel from "@/components/dialogs/settings/emailSettingsPanel";
import LogoSettingsPanel from "@/components/dialogs/settings/logoSettingsPanel";
import LogsSettingsPanel from "@/components/dialogs/settings/logsSettingsPanel";
import UpdateSettingsPanel from "@/components/dialogs/settings/updateSettingsPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ThemeSettingsSection from "@/components/settings/themeSettingsSection";
import UsersSettingsSection from "@/components/settings/usersSettingsSection";
import { useAuth } from "@/components/use-auth";

type SettingsSectionKey = "theme" | "users" | "logo" | "email" | "backup" | "update" | "logs";

const settingsSectionKeys: SettingsSectionKey[] = ["theme", "users", "logo", "email", "backup", "update", "logs"];

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
        key: "users",
        label: "Utenti",
        description: "Account che possono accedere all'app",
        icon: Users,
    },
    {
        key: "logo",
        label: "Logo",
        description: "Logo del laboratorio su app e report",
        icon: Image,
    },
    {
        key: "email",
        label: "Email",
        description: "Configurazione SMTP per l'invio email",
        icon: Mail,
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
    {
        key: "logs",
        label: "Log",
        description: "Registro delle azioni eseguite",
        icon: ScrollText,
    },
];

const isSettingsSectionKey = (value: string | null): value is SettingsSectionKey =>
    value != null && (settingsSectionKeys as string[]).includes(value);

const SettingsPage = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const sectionFromUrl = searchParams.get("section");
    const [activeSection, setActiveSectionState] = useState<SettingsSectionKey>(
        isSettingsSectionKey(sectionFromUrl) && (sectionFromUrl !== "users" || user?.isAdmin) ? sectionFromUrl : "theme"
    );
    const visibleSettingsSections = settingsSections.filter((section) => section.key !== "users" || user?.isAdmin);

    const setActiveSection = (section: SettingsSectionKey) => {
        setActiveSectionState(section);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("section", section);
            return next;
        }, { replace: true });
    };

    return (
        <div className="flex h-full min-h-0 w-full gap-4">
            <aside className="flex w-full max-w-xs shrink-0 flex-col gap-4 overflow-y-auto rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm">

                <div className="grid gap-1.5">
                    {visibleSettingsSections.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.key;

                        return (
                            <Button
                                key={section.key}
                                type="button"
                                variant="outline"
                                onClick={() => setActiveSection(section.key)}
                                className={cn(
                                    "h-auto items-start justify-start gap-2 rounded-xl border p-2.5 text-left",
                                    isActive && "border-primary bg-primary/10 dark:border-primary dark:bg-primary/10"
                                )}
                            >
                                <Icon className="mt-0.5 size-4 shrink-0" />
                                <span className="grid gap-0.5">
                                    <span className="text-sm font-semibold">{section.label}</span>
                                    <span className="text-xs font-normal text-muted-foreground">{section.description}</span>
                                </span>
                            </Button>
                        );
                    })}
                </div>

                <Card size="sm" className="border-dashed border-primary/20 bg-muted/25 shadow-none">
                    <CardHeader>
                        <CardTitle>Prossime sezioni</CardTitle>
                        <CardDescription className="text-xs">Qui potrai aggiungere nuove aree di configurazione.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        La struttura è già pronta per ospitare altre impostazioni senza cambiare layout.
                    </CardContent>
                </Card>
            </aside>

            <section className="min-w-0 flex-1 overflow-y-auto rounded-2xl border bg-background/90 p-4 shadow-sm backdrop-blur-sm md:p-6">
                {activeSection === "theme" ? (
                    <ThemeSettingsSection />
                ) : activeSection === "users" && user?.isAdmin ? (
                    <UsersSettingsSection />
                ) : activeSection === "logo" ? (
                    <LogoSettingsPanel />
                ) : activeSection === "email" ? (
                    <EmailSettingsPanel />
                ) : activeSection === "backup" ? (
                    <BackupSettingsPanel />
                ) : activeSection === "update" ? (
                    <UpdateSettingsPanel />
                ) : (
                    <LogsSettingsPanel />
                )}
            </section>
        </div>
    );
};

export default SettingsPage;