// I campi segreti (password) non vengono mai restituiti dal backend, quindi non possono
// entrare nel confronto con l'ultimo stato salvato: un valore non vuoto è di per sé una modifica.
export const isSettingsFormDirty = <T extends Record<string, unknown>>(
    current: T,
    saved: T,
    secretKeys: Array<keyof T> = []
): boolean => {
    const hasChangedSecret = secretKeys.some((key) => {
        const value = current[key];
        return typeof value === "string" && value.trim() !== "";
    });

    if (hasChangedSecret) {
        return true;
    }

    const strip = (values: T) => {
        const clone = { ...values };
        for (const key of secretKeys) {
            delete clone[key];
        }
        return clone;
    };

    return JSON.stringify(strip(current)) !== JSON.stringify(strip(saved));
};
