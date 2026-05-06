"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/layout/theme-toggle";
import { useAuth } from "@/lib/auth/AuthContext";

export function QuickTopbar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const roleRoot = pathname.split("/")[1] || "dashboard";
  const roleLabel =
    roleRoot === "dashboard"
      ? "Admin"
      : roleRoot === "supervisor"
        ? "Supervisor"
        : roleRoot === "teamleader"
          ? "Team Leader"
          : roleRoot === "user"
            ? "Field"
            : "Workspace";

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur">
      <SidebarTrigger />
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {roleLabel}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle className="h-8 w-8" />
        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
          <Link href={`/${roleRoot}/settings`}>
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Log out</span>
        </Button>
      </div>
    </header>
  );
}
