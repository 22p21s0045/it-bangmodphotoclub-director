import { useRouteLoaderData, Link, useSubmit } from "@remix-run/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { User } from "../../../shared/types";

export function UserNav() {
  const submit = useSubmit();
  const data = useRouteLoaderData("root") as { user: User | null };
  const user = data?.user;

  if (!user) {
    return (
      <Button variant="ghost" asChild>
        <Link to="/auth/login">Login</Link>
      </Button>
    );
  }

  const roleName = user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "สมาชิก";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 h-10 rounded-full hover:bg-accent transition-colors outline-none focus:outline-none">
          <span className="hidden sm:flex flex-col items-end text-right">
             <span className="text-sm font-medium leading-none">{user.name || "User"}</span>
             <span className="text-xs text-muted-foreground">{roleName}</span>
          </span>
          <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name || "User"} className="aspect-square h-full w-full" />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </span>
            )}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground font-semibold text-primary">
              {roleName}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>New Team</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          onSelect={() => submit(null, { action: "/auth/logout", method: "post" })}
        >
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
