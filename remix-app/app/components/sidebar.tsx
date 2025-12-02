import { Link, useLocation } from "@remix-run/react";
import { Calendar, ChevronLeft, ChevronRight, Home, List } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";
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

  return (
    <div
      className={cn(
        "relative flex h-full flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && <h1 className="text-xl font-bold truncate">IT Bangmod Director</h1>}
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
      </nav>
    </div>
  );
}
