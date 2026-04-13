import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Props = Readonly<{
    text: string
    icon: LucideIcon
    number: string
    iconColor?: string
}>

const CardDashboard = ({ text, icon: Icon, number, iconColor }: Props) => {
    return (
        <div className="flex flex-col w-58 rounded-lg border bg-card p-6 gap-2 shadow">
            <div className="flex items-center justify-between">
                <Label className="text-lg">{text}</Label>
                <Icon className={cn(`size-6 text-muted-foreground`, iconColor)} />
            </div>
            <Label className="text-3xl font-bold">{number}</Label>
        </div>
    );
}

export default CardDashboard;