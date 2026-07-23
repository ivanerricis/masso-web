import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const IssuePage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="flex flex-col w-full h-full gap-4">
            <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon-lg" variant="ghost" onClick={handleBack} aria-label="Torna indietro">
                            <ArrowLeft className="size-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Torna indietro</TooltipContent>
                </Tooltip>
                <h1 className="text-2xl font-bold">Difetto ID {id}</h1>
            </div>
            <div className="rounded-md border border-primary p-4 text-muted-foreground">
                Pagina dettaglio difetto in preparazione.
            </div>
        </div>
    );
};

export default IssuePage;
