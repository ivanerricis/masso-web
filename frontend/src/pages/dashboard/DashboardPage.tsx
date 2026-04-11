import { ClipboardList, PlusCircle } from "lucide-react";
import CardDashboard from "./components/cardDashboard";
import CustomDialog from "@/components/dialogs/customDialog";
import { useState } from "react";

const DashboardPage = () => {
    const [dialogCreateReportOpen, setDialogCreateReportOpen] = useState(false)
    const [dialogCreateCustomerOpen, setDialogCreateCustomerOpen] = useState(false)

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Panoramica del laboratorio e stato delle riparazioni.
                </p>
            </div>

            <div className="flex flex-wrap gap-4">
                <CardDashboard
                    text="Crea rapportino"
                    icon={PlusCircle}
                    onOpenChange={setDialogCreateReportOpen}
                />
                <CardDashboard
                    text="Lista rapportini"
                    icon={ClipboardList}
                />
                <CardDashboard
                    text="Crea cliente"
                    icon={PlusCircle}
                    onOpenChange={setDialogCreateCustomerOpen}
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

            <CustomDialog
                open={dialogCreateCustomerOpen}
                onOpenChange={setDialogCreateCustomerOpen}
                title="Crea nuovo cliente"
                content={
                    <div>
                        <p>Contenuto del dialog per creare un nuovo cliente</p>
                    </div>
                }
            />
        </div>
    );
}

export default DashboardPage;