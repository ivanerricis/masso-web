import { Button } from "@/components/ui/button"
import { Bug, Laptop, LayoutDashboard, Users, Wrench } from "lucide-react"
import { Outlet, useNavigate } from "react-router-dom"

export const MainLayout = () => {
    const navigate = useNavigate()

    return (
        <div className="flex min-h-screen">
            <div className="w-xs border-r h-full">
                <div className="border-b h-12 p-2 text-lg font-bold flex items-center gap-2">
                    <Wrench className="ml-2" />
                    FutureOffice
                </div>
                <div className="h-full w-full p-2 flex flex-col gap-1">
                    <Button variant={"sidebar"} size={"lg"} onClick={() => navigate("/dashboard")}>
                        <LayoutDashboard />
                        Dashboard
                    </Button>
                    <Button variant={"sidebar"} size={"lg"} onClick={() => navigate("/clienti")}>
                        <Users />
                        Clienti
                    </Button>
                    <Button variant={"sidebar"} size={"lg"} onClick={() => navigate("/tecnici")}>
                        <Wrench />
                        Tecnici
                    </Button>
                    <Button variant={"sidebar"} size={"lg"} onClick={() => navigate("/dispositivi")}>
                        <Laptop />
                        Dispositivi
                    </Button>
                    <Button variant={"sidebar"} size={"lg"} onClick={() => navigate("/difetti")}>
                        <Bug />
                        Difetti
                    </Button>
                </div>
            </div>
            <div className="flex flex-col w-full h-full">
                <header className="border-b h-12">
                </header>
                <main className="flex-1 w-full p-4">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}