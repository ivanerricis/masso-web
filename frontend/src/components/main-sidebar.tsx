import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
    BookUser,
    Bug,
    ClipboardList,
    Laptop,
    LayoutDashboard,
    Users,
    Wrench,
    type LucideIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

type SidebarItem = {
    label: string;
    path: string;
    icon: LucideIcon;
};

const sidebarItems: SidebarItem[] = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Rapporti", path: "/reports", icon: ClipboardList },
    { label: "Clienti", path: "/clients", icon: Users },
    { label: "Collaboratori", path: "/collaborators", icon: BookUser },
    { label: "Tecnici", path: "/technicians", icon: Wrench },
    { label: "Dispositivi", path: "/devices", icon: Laptop },
    { label: "Difetti", path: "/issues", icon: Bug },
];

const isPathActive = (pathname: string, itemPath: string) => {
    if (pathname === itemPath) {
        return true;
    }

    return pathname.startsWith(`${itemPath}/`);
};

const MainSidebar = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="border-b border-sidebar-border px-3 py-2">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                        <Wrench className="size-5" />
                    </div>
                    <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-semibold text-sidebar-foreground">FutureOffice</span>
                        <span className="text-xs text-sidebar-foreground/70">Laboratorio</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-2 py-3">
                <SidebarMenu className="gap-1">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const active = isPathActive(pathname, item.path);

                        return (
                            <SidebarMenuItem key={item.path}>
                                <SidebarMenuButton
                                    tooltip={item.label}
                                    isActive={active}
                                    onClick={() => navigate(item.path)}
                                    size={"lg"}
                                    className={active ? "bg-primary! text-background! dark:text-foreground!" : undefined}
                                >
                                    <Icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
};

export default MainSidebar;
