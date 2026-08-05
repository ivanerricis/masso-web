import { Button } from "@/components/ui/button";
import { SettingsActions, SettingsCard, SettingsLoadingBox } from "@/components/settings/settingsUi";
import BackupScheduleFields from "./backupScheduleFields";
import BackupSmbFields from "./backupSmbFields";
import type { BackupPanel } from "./useBackupPanel";

const BackupConfigurationCard = ({ panel }: { panel: BackupPanel }) => (
    <SettingsCard
        title="Configurazione"
        description="Pianificazione del dump automatico e copia su condivisione di rete. Le due sezioni si salvano insieme con il pulsante in fondo."
    >
        {panel.isLoading ? (
            <SettingsLoadingBox />
        ) : (
            <>
                <div className="grid gap-3 xl:grid-cols-2">
                    <BackupScheduleFields panel={panel} />
                    <BackupSmbFields panel={panel} />
                </div>

                <SettingsActions>
                    <Button
                        type="button"
                        disabled={panel.isSaving || panel.isLoading || panel.isRunningBackup || !panel.isDirty}
                        onClick={() => void panel.handleSave()}
                    >
                        {panel.isSaving ? "Salvataggio..." : "Salva impostazioni"}
                    </Button>
                </SettingsActions>
            </>
        )}
    </SettingsCard>
);

export default BackupConfigurationCard;
