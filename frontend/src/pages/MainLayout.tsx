import { ModeToggle } from "@/components/mode-toggle"
import MainSidebar from "@/components/main-sidebar"
import { Outlet } from "react-router-dom"

export const MainLayout = () => {
    return (
        <div className="flex h-screen">
            <MainSidebar />
            <div className="flex flex-col w-full">
                <header className="border-b h-14 flex items-center justify-end p-2">
                    <ModeToggle />
                </header>
                <main className="flex-1 p-4 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}