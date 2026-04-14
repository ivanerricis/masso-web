import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const TechnicianPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="flex flex-col w-full h-full gap-4">
            <div className="flex items-center gap-2">
                <Button size="icon-lg" variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="size-6" />
                </Button>
                <h1 className="text-2xl font-bold">Tecnico ID {id}</h1>
            </div>
            <div className="rounded-md border border-primary p-4 text-muted-foreground">
                Pagina dettaglio tecnico in preparazione.
            </div>
        </div>
    );
};

export default TechnicianPage;
