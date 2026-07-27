import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { UpdateGuardContext } from "@/components/update-guard-context";

export const UpdateGuardProvider = ({ children }: { children: ReactNode }) => {
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!isUpdating) {
            return;
        }

        // I container vengono ricostruiti durante l'aggiornamento: evitiamo che l'utente
        // chiuda o ricarichi la scheda lasciando l'app in uno stato inconsistente.
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isUpdating]);

    return (
        <UpdateGuardContext.Provider value={{ setIsUpdating }}>
            {children}
            {isUpdating ? (
                <div
                    className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-background/90 backdrop-blur-sm"
                    role="alert"
                    aria-live="assertive"
                >
                    <Loader2 className="size-10 animate-spin text-primary" />
                    <p className="text-lg font-semibold">Aggiornamento in corso...</p>
                    <p className="max-w-sm text-center text-sm text-muted-foreground">
                        Non chiudere o ricaricare la pagina: l'applicazione si ricaricherà automaticamente al termine.
                    </p>
                </div>
            ) : null}
        </UpdateGuardContext.Provider>
    );
};
