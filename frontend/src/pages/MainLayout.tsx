import { ModeToggle } from "@/components/mode-toggle"
import MainSidebar from "@/components/main-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Outlet } from "react-router-dom"

export const MainLayout = () => {
    return (
        <SidebarProvider defaultOpen>
            <MainSidebar />
            <SidebarInset>
                <header className="flex h-14 items-center justify-between border-b px-3">
                    <SidebarTrigger />
                    <ModeToggle />
                </header>
                <main className="flex-1 overflow-auto p-4">
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}