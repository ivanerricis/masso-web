import { Loader2 } from "lucide-react";

const LoadingPage = () => {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="size-10 text-primary animate-spin" />
        </div>
    );
}

export default LoadingPage;