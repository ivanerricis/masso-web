import { Label } from "@/components/ui/label";
import type { LucideIcon } from "lucide-react";

type Props = Readonly<{
    text: string
    icon: LucideIcon
    onOpenChange?: (open: boolean) => void;
}>

const CardDashboard = ({ text, icon: Icon, onOpenChange }: Props) => {
    return (
        <div
            role="button"
            onClick={onOpenChange ? () => onOpenChange(true) : undefined}
            className="flex flex-col items-center justify-center rounded-lg border bg-card p-6 gap-2 shadow cursor-pointer hover:bg-primary/10
            *:hover:cursor-pointer"
        >
            <Label className="text-lg">{text}</Label>
            <Icon />
        </div>
    );
}

export default CardDashboard;