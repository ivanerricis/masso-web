import type { InterventionStatus, InterventionType } from "@/types/dtos";

export const interventionTypeOptions: { value: InterventionType; label: string }[] = [
    { value: "consegna_materiale", label: "Consegna materiale" },
    { value: "intervento_sede", label: "Intervento in sede" },
    { value: "intervento_remoto", label: "Intervento da remoto" },
];

export const interventionStatusOptions: { value: InterventionStatus; label: string }[] = [
    { value: "programmato", label: "Programmato" },
    { value: "in_lavorazione", label: "In lavorazione" },
    { value: "completato", label: "Completato" },
];

export const formatInterventionType = (value: InterventionType) =>
    interventionTypeOptions.find((option) => option.value === value)?.label ?? value;

export const formatInterventionStatus = (value: InterventionStatus) =>
    interventionStatusOptions.find((option) => option.value === value)?.label ?? value;

export const isOnSiteInterventionType = (value: InterventionType) =>
    value === "intervento_sede" || value === "intervento_remoto";

export const interventionDescriptionLabel = (value: InterventionType) =>
    value === "consegna_materiale" ? "Materiali da consegnare" : "Assistenza effettuata";

export const formatInterventionTime = (value: string | null) => (value ? value.slice(0, 5) : "-");
