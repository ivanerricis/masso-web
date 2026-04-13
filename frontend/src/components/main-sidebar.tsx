import { Button } from "@/components/ui/button";
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
        <aside className="w-xs border-r bg-sidebar">
            <div className="border-b h-14 p-2 text-lg font-bold flex items-center gap-2">
                <Wrench className="ml-2" />
                FutureOffice
            </div>
            <div className="w-full p-2 flex flex-col gap-1">
                {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const active = isPathActive(pathname, item.path);

                    return (
                        <Button
                            key={item.path}
                            variant="sidebar"
                            size="lg"
                            onClick={() => navigate(item.path)}
                            data-state={active ? "open" : "closed"}
                            className={`text-lg ${active ? "bg-primary! text-background dark:text-foreground" : undefined}`}
                        >
                            <Icon />
                            {item.label}
                        </Button>
                    );
                })}
            </div>
        </aside>
    );
};

export default MainSidebar;
