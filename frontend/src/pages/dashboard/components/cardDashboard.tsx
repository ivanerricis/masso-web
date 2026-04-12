import { Label } from "@/components/ui/label";
import type { LucideIcon } from "lucide-react";

type Props = Readonly<{
    text: string
    icon: LucideIcon
    number: string
}>

const CardDashboard = ({ text, icon: Icon, number }: Props) => {
    return (
        <div className="flex flex-col w-58 rounded-lg border bg-card p-6 gap-2 shadow">
            <div className="flex items-center justify-between">
                <Label className="text-lg">{text}</Label>
                <Icon className="size-5 text-muted-foreground" />
            </div>
            <Label className="text-2xl font-bold">{number}</Label>
        </div>
    );
}

export default CardDashboard;