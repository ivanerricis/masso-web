import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingPageProps = {
    className?: string;
};

const LoadingPage = ({ className }: LoadingPageProps) => {
    return (
        <div className={cn("flex h-full w-full items-center justify-center", className)}>
            <Loader2 className="size-10 text-primary animate-spin" />
        </div>
    );
}

export default LoadingPage;