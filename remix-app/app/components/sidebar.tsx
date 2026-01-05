import { Link, useLocation, useRouteLoaderData } from "@remix-run/react";
import { Album, Calendar, LayoutDashboard, List, Target, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "~/types";
import { cn } from "~/lib/utils";
import { useTheme } from "~/store/useTheme";

const generalItems = [
  {
    title: "อัลบั้ม",
    href: "/",
    icon: Album,
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
  {
    title: "ภารกิจ",
    href: "/missions",
    icon: Target,
  },
];

const adminItems = [
  {
    title: "เเดชบอร์ด",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "จัดการภารกิจ",
    href: "/admin/missions",
    icon: Target,
  },
  {
    title: "จัดการผู้ใช้งาน",
    href: "/admin/users",
    icon: Users,
  },
];

export function Sidebar() {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const data = useRouteLoaderData("root") as { user: User | null };
  const user = data?.user;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sidebar is collapsed by default, expands on hover
  const isCollapsed = !isHovered;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col bg-background transition-all duration-300 border-r border-border/50",
        isCollapsed ? "w-16" : "w-56"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-center p-4 pb-2">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 px-2">
            <img 
              src={mounted && theme === 'dark' ? "/logo-dark.svg" : "/logo.svg"} 
              alt="Logo" 
              className="h-25 w-auto" 
            />
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <img 
              src={mounted && theme === 'dark' ? "/images/sidebar/logo-minimal-dark.png" : "/images/sidebar/logo-minimal-light.png"} 
              alt="Logo" 
              className="h-18 w-18 object-contain" 
            />
          </div>
        )}
      </div>
      <nav className="flex flex-col gap-1 px-2">
        {/* ทั่วไป Section */}
        {!isCollapsed && (
          <div className="px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              ทั่วไป
            </span>
          </div>
        )}
        {isCollapsed && <div className="my-1 mx-2 border-t border-border" />}
        {generalItems.map((item) => {
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
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.title}</span>}
            </Link>
          );
        })}

        {/* การจัดการ Section (Admin only) */}
        {user?.role === "ADMIN" && (
          <>
            {!isCollapsed && (
              <div className="px-3 py-2 mt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  การจัดการ
                </span>
              </div>
            )}
            {isCollapsed && <div className="my-2 mx-2 border-t border-border" />}
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.href);

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
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.title}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </div>
  );
}
