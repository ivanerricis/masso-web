import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Props = Readonly<{
    text: string
    mobileText?: string
    icon: LucideIcon
    number: string
    iconColor?: string
    onClick?: () => void
}>

const CardDashboard = ({ text, mobileText, icon: Icon, number, iconColor, onClick }: Props) => {
    const isInteractive = onClick != null;

    return (
        <div
            className={cn(
                "flex flex-col w-full gap-0.5 rounded-lg border bg-card p-2 shadow sm:w-48 sm:gap-1 sm:p-4",
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
            <div className="flex items-center justify-between gap-1">
                <Label className="truncate text-xs sm:text-base">
                    {mobileText ? (
                        <>
                            <span className="sm:hidden">{mobileText}</span>
                            <span className="hidden sm:inline">{text}</span>
                        </>
                    ) : (
                        text
                    )}
                </Label>
                <Icon className={cn("size-4 shrink-0 text-muted-foreground sm:size-5", iconColor)} />
            </div>
            <Label className="text-lg font-bold sm:text-2xl">{number}</Label>
        </div>
    );
}

export default CardDashboard;