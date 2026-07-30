const dateLabelFormatter = new Intl.DateTimeFormat("it-IT", { dateStyle: "medium" });

export const formatDateLabel = (value: Date) => dateLabelFormatter.format(value);

// Le date "solo giorno" arrivano come stringhe YYYY-MM-DD: l'ora esplicita evita che
// vengano interpretate come UTC e slittino al giorno precedente.
export const formatDayLabel = (value: string) => dateLabelFormatter.format(new Date(`${value}T00:00:00`));

// Un intervallo vuoto non produce etichetta: chi chiama la omette dal PDF.
export const buildDateRangeLabel = (dateFrom?: string, dateTo?: string) => {
    if (dateFrom && dateTo) {
        return `Dal ${formatDayLabel(dateFrom)} al ${formatDayLabel(dateTo)}`;
    }

    if (dateFrom) {
        return `Dal ${formatDayLabel(dateFrom)}`;
    }

    if (dateTo) {
        return `Fino al ${formatDayLabel(dateTo)}`;
    }

    return undefined;
};

export const formatPhoneLabel = (primary?: string | null, secondary?: string | null) => {
    const trimmedPrimary = primary?.trim() ?? "";
    const trimmedSecondary = secondary?.trim() ?? "";

    if (trimmedPrimary && trimmedSecondary) {
        return `${trimmedPrimary} - ${trimmedSecondary}`;
    }

    return trimmedPrimary || trimmedSecondary || "N/D";
};

export const formatScheduleLabel = (
    interventionDate: string | null,
    startTime: string | null,
    endTime: string | null
) => {
    if (!interventionDate) {
        return null;
    }

    const timeRange = startTime && endTime ? `${startTime.slice(0, 5)}-${endTime.slice(0, 5)}` : null;

    return [formatDayLabel(interventionDate), timeRange].filter(Boolean).join(" ");
};
