import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Props = Readonly<{
    text: string
    icon: LucideIcon
    number: string
    iconColor?: string
    onClick?: () => void
}>

const CardDashboard = ({ text, icon: Icon, number, iconColor, onClick }: Props) => {
    const isInteractive = onClick != null;

    return (
        <div
            className={cn(
                "flex flex-col w-58 rounded-lg border bg-card p-6 gap-2 shadow",
                isInteractive && "cursor-pointer *:cursor-pointer *:*:cursor-pointer hover:bg-accent/35"
            )}
            onClick={onClick}
            role={isInteractive ? "button" : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            onKeyDown={
                isInteractive
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onClick();
                        }
                    }
                    : undefined
            }
        >
            <div className="flex items-center justify-between">
                <Label className="text-lg">{text}</Label>
                <Icon className={cn(`size-6 text-muted-foreground`, iconColor)} />
            </div>
            <Label className="text-3xl font-bold">{number}</Label>
        </div>
    );
}

export default CardDashboard;