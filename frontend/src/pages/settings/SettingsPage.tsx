import { useSearchParams } from "react-router-dom";
import { Building2, Database, Mail, Palette, RefreshCw, ScrollText, Users } from "lucide-react";
import BackupSettingsPanel from "@/components/settings/backupSettingsPanel";
import CompanySettingsPanel from "@/components/settings/companySettingsPanel";
import EmailSettingsPanel from "@/components/settings/emailSettingsPanel";
import LogsSettingsPanel from "@/components/settings/logsSettingsPanel";
import UpdateSettingsPanel from "@/components/settings/updateSettingsPanel";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import ThemeSettingsSection from "@/components/settings/themeSettingsSection";
import UsersSettingsSection from "@/components/settings/usersSettingsSection";
import { useAuth } from "@/components/use-auth";

type SettingsSectionKey = "theme" | "users" | "company" | "email" | "backup" | "update" | "logs";

const settingsSectionKeys: SettingsSectionKey[] = ["theme", "users", "company", "email", "backup", "update", "logs"];

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
        key: "company",
        label: "Azienda",
        description: "Dati e logo del laboratorio su app e PDF",
        icon: Building2,
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
        description: "Dump, archivio e ripristino",
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

// "update" è riservata all'amministratore come "users": non cambia una preferenza, esegue
// sull'host il codice di origin/main e ricostruisce lo stack. Il backend la protegge con
// requireAdmin; qui la si nasconde perché a un non-admin risponderebbe solo 403.
const adminOnlySections = new Set<SettingsSectionKey>(["users", "update"]);

const SettingsPage = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const sectionFromUrl = searchParams.get("section");
    const canOpenSection = (section: SettingsSectionKey) => !adminOnlySections.has(section) || Boolean(user?.isAdmin);
    const activeSection: SettingsSectionKey =
        isSettingsSectionKey(sectionFromUrl) && canOpenSection(sectionFromUrl) ? sectionFromUrl : "theme";
    const visibleSettingsSections = settingsSections.filter((section) => canOpenSection(section.key));

    const setActiveSection = (section: SettingsSectionKey) => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set("section", section);
                return next;
            },
            { replace: true }
        );
    };

    return (
        <div className="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto sm:flex-row sm:overflow-visible">
            <Select value={activeSection} onValueChange={(value) => setActiveSection(value as SettingsSectionKey)}>
                <SelectTrigger className="w-full sm:hidden">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {visibleSettingsSections.map((section) => {
                        const Icon = section.icon;

                        return (
                            <SelectItem key={section.key} value={section.key}>
                                <Icon className="size-4" />
                                {section.label}
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>

            <aside className="hidden w-full shrink-0 flex-col gap-4 overflow-y-auto rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:flex sm:max-w-xs">
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
                                    <span className="text-xs font-normal text-muted-foreground">
                                        {section.description}
                                    </span>
                                </span>
                            </Button>
                        );
                    })}
                </div>
            </aside>

            <section className="min-w-0 flex-1 overflow-y-auto rounded-2xl border bg-background/90 p-4 shadow-sm backdrop-blur-sm md:p-6">
                {activeSection === "theme" ? (
                    <ThemeSettingsSection />
                ) : activeSection === "users" && user?.isAdmin ? (
                    <UsersSettingsSection />
                ) : activeSection === "company" ? (
                    <CompanySettingsPanel />
                ) : activeSection === "email" ? (
                    <EmailSettingsPanel />
                ) : activeSection === "backup" ? (
                    <BackupSettingsPanel />
                ) : activeSection === "update" && user?.isAdmin ? (
                    <UpdateSettingsPanel />
                ) : (
                    <LogsSettingsPanel />
                )}
            </section>
        </div>
    );
};

export default SettingsPage;
