import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react";
import { useTheme } from "@/components/use-theme";

const Toaster = ({ ...props }: ToasterProps) => {
    // Il tema va letto dal ThemeProvider dell'app. La versione shadcn di questo file lo
    // prendeva da `next-themes`, che qui non ha nessun provider sopra: l'hook restituiva un
    // oggetto vuoto e il toaster restava fisso su "system", cioè seguiva le preferenze del
    // sistema operativo invece della scelta fatta nell'app.
    const { theme } = useTheme();

    return (
        <Sonner
            theme={theme}
            className="toaster group"
            icons={{
                success: <CircleCheckIcon className="size-5" />,
                info: <InfoIcon className="size-5" />,
                warning: <TriangleAlertIcon className="size-5" />,
                error: <OctagonXIcon className="size-5" />,
                loading: <Loader2Icon className="size-5 animate-spin" />,
            }}
            style={
                {
                    "--normal-bg": "var(--popover)",
                    "--normal-text": "var(--popover-foreground)",
                    "--normal-border": "var(--border)",
                    "--border-radius": "var(--radius)",
                } as React.CSSProperties
            }
            toastOptions={{
                classNames: {
                    toast: "cn-toast",
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
