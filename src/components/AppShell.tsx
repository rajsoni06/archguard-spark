import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  FileText,
  FolderKanban,
  History,
  LayoutDashboard,
  LayoutTemplate,
  Moon,
  Settings,
  Sun,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/", label: "Architecture Designer", icon: Workflow },
  { to: "/projects", label: "My Projects", icon: FolderKanban },
  { to: "/history", label: "Review History", icon: History },
  { to: "/knowledge", label: "Knowledge Hub", icon: BookOpen },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/team", label: "Team Collaboration", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside className="hidden w-[236px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
            <ShieldCheck className="size-4.5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">ArchGuard AI</div>
            <div className="text-[11px] text-muted-foreground">Architecture Review</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className={cn("size-4", active && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 pb-2">
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Rule Engine decides.</span> AI explains.
              Scores are deterministic.
            </p>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}