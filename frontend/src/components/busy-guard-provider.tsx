import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { BusyGuardContext, type BusyGuardState } from "@/components/busy-guard-context";

export const BusyGuardProvider = ({ children }: { children: ReactNode }) => {
    const [busy, setBusy] = useState<BusyGuardState | null>(null);

    useEffect(() => {
        if (!busy) {
            return;
        }

        // Alcune operazioni (aggiornamento, ripristino database) lasciano l'app in uno
        // stato inconsistente se interrotte: evitiamo che l'utente chiuda o ricarichi la scheda.
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [busy]);

    return (
        <BusyGuardContext.Provider value={{ setBusy }}>
            {children}
            {busy ? (
                <div
                    className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-background/90 backdrop-blur-sm"
                    role="alert"
                    aria-live="assertive"
                >
                    <Loader2 className="size-10 animate-spin text-primary" />
                    <p className="text-lg font-semibold">{busy.title}</p>
                    <p className="max-w-sm text-center text-sm text-muted-foreground">{busy.description}</p>
                </div>
            ) : null}
        </BusyGuardContext.Provider>
    );
};
