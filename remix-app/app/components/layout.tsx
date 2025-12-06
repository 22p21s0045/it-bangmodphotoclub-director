import { useLocation } from "@remix-run/react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isLoginPage = location.pathname.startsWith("/auth/login");

  if (isLoginPage) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
