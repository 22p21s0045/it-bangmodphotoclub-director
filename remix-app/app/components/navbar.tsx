import { ThemeToggle } from "~/components/theme-toggle";
import { UserNav } from "~/components/user-nav";

export function Navbar() {
  return (
    <div>
      <div className="flex h-16 items-center px-4">
        {/* Left side - can be breadcrumbs or mobile toggle later */}
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </div>
  );
}
