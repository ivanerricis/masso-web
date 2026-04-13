import { CircleCheck, CircleDashed, Euro } from "lucide-react";
import CardDashboard from "./components/cardDashboard";
import CustomDialog from "@/components/dialogs/customDialog";
import PageHeader from "@/components/page-header";
import { useState } from "react";
import CreateEntityButton from "@/components/create-entity-button";

const DashboardPage = () => {
    const [dialogCreateReportOpen, setDialogCreateReportOpen] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Dashboard"
                description="Panoramica del laboratorio e stato delle riparazioni."
                action={
                    <CreateEntityButton label="Nuovo rapportino" onClick={() => setDialogCreateReportOpen(true)} />
                }
            />

            <div className="flex flex-wrap gap-4">
                <CardDashboard
                    text="Rapportini aperti"
                    icon={CircleDashed}
                    number="5"
                    iconColor="text-destructive"
                />
                <CardDashboard
                    text="Rapportini chiusi"
                    icon={CircleCheck}
                    number="5"
                    iconColor="text-green-400"
                />
                <CardDashboard
                    text="Incassi totali"
                    icon={Euro}
                    number="10"
                    iconColor="text-yellow-400"
                />
            </div>

            <CustomDialog
                open={dialogCreateReportOpen}
                onOpenChange={setDialogCreateReportOpen}
                title="Crea nuovo rapportino"
                content={
                    <div>
                        <p>Contenuto del dialog per creare un nuovo rapportino</p>
                    </div>
                }
            />
        </div>
    );
}

export default DashboardPage;