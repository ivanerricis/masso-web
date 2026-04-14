import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ReportPage = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center gap-2">
                <Button size={"icon-lg"} variant={"ghost"} onClick={handleBack}>
                    <ArrowLeft className="size-6" />
                </Button>
                <h1 className="text-2xl font-bold">Rapportino numero</h1>
            </div>
            <div>

            </div>
        </div>
    );
}

export default ReportPage;