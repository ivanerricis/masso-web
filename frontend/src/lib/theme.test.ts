import { beforeEach, describe, expect, it } from "vitest";
import {
    applyCornerRadius,
    applyFontSize,
    applyTableDensity,
    applyThemeAccentPreset,
    getStoredCornerRadius,
    getStoredFontSize,
    getStoredTableDensity,
    getStoredTableRowsPerPage,
    getStoredThemeAccentPreset,
    setStoredTableRowsPerPage,
    setStoredThemeAccentPreset,
    themeAccentPresets,
} from "./theme";

beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("style");
    document.documentElement.removeAttribute("data-table-density");
    document.documentElement.removeAttribute("data-font-size");
});

describe("preferenze di tema salvate", () => {
    /**
     * Le chiavi arrivano da localStorage, che è modificabile a mano e sopravvive agli
     * aggiornamenti: un valore non più valido (una preferenza rimossa in una versione
     * successiva) non deve propagarsi come chiave sconosciuta al resto dell'app.
     */
    it("ignora un valore salvato che non corrisponde a nessun preset", () => {
        localStorage.setItem("easylab-web-theme-accent", "preset-inesistente");

        expect(getStoredThemeAccentPreset()).toBeNull();
    });

    it("restituisce il preset salvato quando è valido", () => {
        setStoredThemeAccentPreset("ocean");

        expect(getStoredThemeAccentPreset()).toBe("ocean");
    });

    /**
     * "default" non viene scritto: l'assenza della chiave È il default. Salvarlo
     * significherebbe congelare l'aspetto attuale anche se il default cambia.
     */
    it("non salva il valore predefinito", () => {
        setStoredThemeAccentPreset("ocean");
        setStoredThemeAccentPreset("default");

        expect(localStorage.getItem("easylab-web-theme-accent")).toBeNull();
        expect(getStoredThemeAccentPreset()).toBeNull();
    });

    it("rimuove la chiave quando il preset viene azzerato", () => {
        setStoredThemeAccentPreset("forest");
        setStoredThemeAccentPreset(null);

        expect(getStoredThemeAccentPreset()).toBeNull();
    });

    it("righe per pagina: default a 10 e valori non validi scartati", () => {
        expect(getStoredTableRowsPerPage()).toBe(10);

        localStorage.setItem("easylab-web-table-rows-per-page", "999");
        expect(getStoredTableRowsPerPage()).toBe(10);

        setStoredTableRowsPerPage(50);
        expect(getStoredTableRowsPerPage()).toBe(50);

        setStoredTableRowsPerPage(10);
        expect(localStorage.getItem("easylab-web-table-rows-per-page")).toBeNull();
    });

    it("densità e dimensione carattere non valide non vengono restituite", () => {
        localStorage.setItem("easylab-web-table-density", "gigante");
        localStorage.setItem("easylab-web-font-size", "enorme");

        expect(getStoredTableDensity()).toBeNull();
        expect(getStoredFontSize()).toBeNull();
    });

    it("raggio degli angoli non valido non viene restituito", () => {
        localStorage.setItem("easylab-web-corner-radius", "ovale");

        expect(getStoredCornerRadius()).toBeNull();
    });
});

describe("applicazione del tema al DOM", () => {
    it("scrive le variabili CSS del preset scelto", () => {
        const ocean = themeAccentPresets.find((preset) => preset.key === "ocean");
        expect(ocean).toBeDefined();

        applyThemeAccentPreset("ocean");

        const root = document.documentElement;
        expect(root.style.getPropertyValue("--primary")).toBe(ocean!.primary);
        expect(root.style.getPropertyValue("--ring")).toBe(ocean!.ring);
        expect(root.style.getPropertyValue("--chart-1")).toBe(ocean!.chart1);
    });

    /**
     * Tornare al default deve rimuovere le variabili inline, non riscriverle con i valori
     * del tema chiaro: altrimenti il tema scuro resterebbe con i colori di quello chiaro.
     */
    it("rimuove le variabili CSS tornando al preset predefinito", () => {
        applyThemeAccentPreset("rose");
        applyThemeAccentPreset("default");

        const root = document.documentElement;
        expect(root.style.getPropertyValue("--primary")).toBe("");
        expect(root.style.getPropertyValue("--sidebar-primary")).toBe("");
        expect(root.style.getPropertyValue("--chart-5")).toBe("");
    });

    it("ignora un preset sconosciuto senza toccare il DOM", () => {
        applyThemeAccentPreset("ocean");
        const before = document.documentElement.style.getPropertyValue("--primary");

        applyThemeAccentPreset("non-esiste" as never);

        expect(document.documentElement.style.getPropertyValue("--primary")).toBe(before);
    });

    it("densità e dimensione carattere passano da attributi sull'elemento radice", () => {
        applyTableDensity("compact");
        applyFontSize("lg");

        expect(document.documentElement.getAttribute("data-table-density")).toBe("compact");
        expect(document.documentElement.getAttribute("data-font-size")).toBe("lg");

        applyTableDensity("default");
        applyFontSize("default");

        expect(document.documentElement.getAttribute("data-table-density")).toBeNull();
        expect(document.documentElement.getAttribute("data-font-size")).toBeNull();
    });

    it("il raggio degli angoli scrive la variabile --radius", () => {
        applyCornerRadius("round");

        expect(document.documentElement.style.getPropertyValue("--radius")).not.toBe("");
    });
});
