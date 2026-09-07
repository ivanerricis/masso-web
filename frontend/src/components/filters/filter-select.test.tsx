import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListFilter } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FilterSelect, { FILTERS_COMPACT_BREAKPOINT } from "./filter-select";

const sortOptions = [
    { value: "createdAt:desc" as const, label: "Più recenti" },
    { value: "createdAt:asc" as const, label: "Meno recenti" },
];

/**
 * `useIsMobile` legge `window.innerWidth` per il valore iniziale: cambiarlo è l'unico modo
 * di provare la modalità compatta in jsdom, che non ha un viewport vero.
 */
const setViewportWidth = (width: number) => {
    Object.defineProperty(window, "innerWidth", { value: width, configurable: true, writable: true });
};

afterEach(() => {
    setViewportWidth(1024);
    vi.restoreAllMocks();
});

describe("FilterSelect", () => {
    it("elenca le opzioni ricevute", async () => {
        const user = userEvent.setup();
        setViewportWidth(1024);
        render(
            <FilterSelect
                value="createdAt:desc"
                onValueChange={() => {}}
                options={sortOptions}
                label="Ordina per"
                icon={ListFilter}
            />
        );

        await user.click(screen.getByRole("combobox", { name: "Ordina per" }));

        expect(screen.getByRole("option", { name: "Più recenti" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Meno recenti" })).toBeInTheDocument();
    });

    it("antepone la voce 'tutti' quando richiesta, con la sua etichetta", async () => {
        const user = userEvent.setup();
        setViewportWidth(1024);
        render(
            <FilterSelect
                value="all"
                onValueChange={() => {}}
                options={[
                    { value: "open" as const, label: "Report aperti" },
                    { value: "closed" as const, label: "Report chiusi" },
                ]}
                allOption={{ value: "all" as const, label: "Tutti i report" }}
                label="Filtra per stato"
                icon={ListFilter}
            />
        );

        await user.click(screen.getByRole("combobox", { name: "Filtra per stato" }));

        const options = screen.getAllByRole("option").map((option) => option.textContent);
        expect(options).toEqual(["Tutti i report", "Report aperti", "Report chiusi"]);
    });

    it("omette la voce 'tutti' quando non è richiesta", async () => {
        const user = userEvent.setup();
        setViewportWidth(1024);
        render(
            <FilterSelect
                value="createdAt:desc"
                onValueChange={() => {}}
                options={sortOptions}
                label="Ordina per"
                icon={ListFilter}
            />
        );

        await user.click(screen.getByRole("combobox", { name: "Ordina per" }));

        expect(screen.getAllByRole("option")).toHaveLength(2);
    });

    it("riporta il valore scelto al chiamante", async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        setViewportWidth(1024);
        render(
            <FilterSelect
                value="createdAt:desc"
                onValueChange={onValueChange}
                options={sortOptions}
                label="Ordina per"
                icon={ListFilter}
            />
        );

        await user.click(screen.getByRole("combobox", { name: "Ordina per" }));
        await user.click(screen.getByRole("option", { name: "Meno recenti" }));

        expect(onValueChange).toHaveBeenCalledWith("createdAt:asc");
    });

    it("sotto il breakpoint mostra solo l'icona, mantenendo l'etichetta accessibile", () => {
        setViewportWidth(FILTERS_COMPACT_BREAKPOINT - 1);
        render(
            <FilterSelect
                value="createdAt:desc"
                onValueChange={() => {}}
                options={sortOptions}
                label="Ordina per"
                icon={ListFilter}
            />
        );

        const trigger = screen.getByRole("combobox", { name: "Ordina per" });

        // Il testo sparisce, ma il nome accessibile resta: è ciò che rende usabile
        // la barra compatta con uno screen reader.
        expect(trigger).not.toHaveTextContent("Più recenti");
        expect(trigger.querySelector("svg")).toBeInTheDocument();
    });

    it("sopra il breakpoint mostra il valore selezionato per esteso", () => {
        setViewportWidth(FILTERS_COMPACT_BREAKPOINT + 1);
        render(
            <FilterSelect
                value="createdAt:desc"
                onValueChange={() => {}}
                options={sortOptions}
                label="Ordina per"
                icon={ListFilter}
            />
        );

        expect(screen.getByRole("combobox", { name: "Ordina per" })).toHaveTextContent("Più recenti");
    });
});
