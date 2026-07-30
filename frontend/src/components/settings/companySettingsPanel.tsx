import { startTransition, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    SettingsActions,
    SettingsCard,
    SettingsField,
    SettingsFieldRow,
    SettingsGroup,
    SettingsLoadingBox,
    SettingsSection,
} from "@/components/settings/settingsUi";
import {
    getApiErrorMessage,
    getCompanySettings,
    updateCompanySettings,
    type CompanySettingsInput,
} from "@/lib/api";

const defaultForm: CompanySettingsInput = {
    name: "",
    email: "",
    address: "",
    phone: "",
};

const CompanySettingsPanel = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formValues, setFormValues] = useState<CompanySettingsInput>(defaultForm);

    const loadSettings = async () => {
        setIsLoading(true);

        try {
            const settings = await getCompanySettings();
            setFormValues(settings);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i dati dell'azienda"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        startTransition(() => {
            void loadSettings();
        });
    }, []);

    const handleSave = async () => {
        if (isSaving || isLoading) {
            return;
        }

        if (!formValues.name.trim()) {
            toast.error("Il nome dell'azienda è obbligatorio");
            return;
        }

        try {
            setIsSaving(true);
            const settings = await updateCompanySettings({
                name: formValues.name.trim(),
                email: formValues.email.trim(),
                address: formValues.address.trim(),
                phone: formValues.phone.trim(),
            });
            setFormValues(settings);
            toast.success("Dati azienda salvati");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile salvare i dati dell'azienda"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SettingsSection>
            <SettingsCard
                title="Azienda"
                description="Dati usati nell'intestazione dei PDF di report e interventi."
            >
                {isLoading ? (
                    <SettingsLoadingBox />
                ) : (
                    <>
                        <SettingsGroup>
                            <SettingsFieldRow>
                                <SettingsField>
                                    <Label htmlFor="companyName">Nome</Label>
                                    <Input
                                        id="companyName"
                                        placeholder="es: Masso"
                                        value={formValues.name}
                                        onChange={(event) =>
                                            setFormValues((prev) => ({ ...prev, name: event.target.value }))
                                        }
                                    />
                                </SettingsField>

                                <SettingsField>
                                    <Label htmlFor="companyEmail">Email</Label>
                                    <Input
                                        id="companyEmail"
                                        type="email"
                                        placeholder="es: info@masso.local"
                                        value={formValues.email}
                                        onChange={(event) =>
                                            setFormValues((prev) => ({ ...prev, email: event.target.value }))
                                        }
                                    />
                                </SettingsField>
                            </SettingsFieldRow>

                            <SettingsFieldRow>
                                <SettingsField>
                                    <Label htmlFor="companyAddress">Indirizzo</Label>
                                    <Input
                                        id="companyAddress"
                                        placeholder="es: Via Roma 1, 00100 Roma"
                                        value={formValues.address}
                                        onChange={(event) =>
                                            setFormValues((prev) => ({ ...prev, address: event.target.value }))
                                        }
                                    />
                                </SettingsField>

                                <SettingsField>
                                    <Label htmlFor="companyPhone">Telefono</Label>
                                    <Input
                                        id="companyPhone"
                                        placeholder="es: +39 000 000 0000"
                                        value={formValues.phone}
                                        onChange={(event) =>
                                            setFormValues((prev) => ({ ...prev, phone: event.target.value }))
                                        }
                                    />
                                </SettingsField>
                            </SettingsFieldRow>
                        </SettingsGroup>

                        <SettingsActions>
                            <Button type="button" disabled={isSaving || isLoading} onClick={() => void handleSave()}>
                                {isSaving ? "Salvataggio..." : "Salva impostazioni"}
                            </Button>
                        </SettingsActions>
                    </>
                )}
            </SettingsCard>
        </SettingsSection>
    );
};

export default CompanySettingsPanel;
