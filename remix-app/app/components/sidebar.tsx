import { Link, useLocation, useRouteLoaderData } from "@remix-run/react";
import { Calendar, ChevronLeft, ChevronRight, Home, List, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "~/types";
import { cn } from "~/lib/utils";
import { useTheme } from "~/store/useTheme";
import { Button } from "./ui/button";

const sidebarItems = [
  {
    title: "หน้าหลัก",
    href: "/",
    icon: Home,
  },
  {
    title: "กิจกรรม",
    href: "/events",
    icon: List,
  },
  {
    title: "ปฏิทิน",
    href: "/calendar",
    icon: Calendar,
  },
];

export function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const data = useRouteLoaderData("root") as { user: User | null };
  const user = data?.user;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={cn(
        "relative flex h-full flex-col bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex items-center justify-between p-4 pb-2">
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-2">
            <img 
              src={mounted && theme === 'dark' ? "/logo-dark.svg" : "/logo.svg"} 
              alt="Logo" 
              className="h-25 w-auto" 
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", isCollapsed ? "mx-auto" : "")}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex flex-col gap-2 px-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                isCollapsed ? "justify-center px-2" : ""
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className="h-4 w-4" />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
        {user?.role === "ADMIN" && (
          <Link
            to="/admin/users"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              location.pathname.startsWith("/admin/users") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              isCollapsed ? "justify-center px-2" : ""
            )}
            title={isCollapsed ? "จัดการผู้ใช้งาน" : undefined}
          >
            <Users className="h-4 w-4" />
            {!isCollapsed && <span>จัดการผู้ใช้งาน</span>}
          </Link>
        )}
      </nav>
    </div>
  );
}
