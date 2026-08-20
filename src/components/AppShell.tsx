import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  FileText,
  FolderKanban,
  History,
  LayoutDashboard,
  Home,
  LayoutTemplate,
  Moon,
  Settings,
  Sun,
  ShieldCheck,
  Users,
  Workflow,
  LogIn,
  UserPlus,
  CircleUserRound,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import AuthDialog from "@/components/ui/auth-modal";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/designer", label: "Architecture Designer", icon: Workflow },
  { to: "/projects", label: "My Projects", icon: FolderKanban },
  { to: "/history", label: "Review History", icon: History },
  { to: "/knowledge", label: "Knowledge Hub", icon: BookOpen },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/team", label: "Team Collaboration", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/profile", label: "Profile", icon: CircleUserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authOpen, setAuthOpen] = useState(false);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside className="hidden w-[236px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex shrink-0 items-center justify-center">
            <img src="/ArchGuard_Logo.png" alt="ArchGuard Logo" className="h-9 w-auto object-contain" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">ArchGuard AI</div>
            <div className="text-[11px] text-muted-foreground">Architecture Review</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {NAV.filter((item) => item.to !== "/profile" || Boolean(user)).map((item) => {
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
          <button
            type="button"
            onClick={() => openAuth("login")}
            aria-current={authOpen && authMode === "login" ? "page" : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
              authOpen && authMode === "login"
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <LogIn className={cn("size-4", authOpen && authMode === "login" && "text-primary")} />
            Login
          </button>
          <button
            type="button"
            onClick={() => openAuth("signup")}
            aria-current={authOpen && authMode === "signup" ? "page" : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
              authOpen && authMode === "signup"
                ? "bg-primary/12 text-primary shadow-[inset_2px_0_0_0_var(--sidebar-primary)]"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <UserPlus className={cn("size-4", authOpen && authMode === "signup" && "text-primary")} />
            Sign Up
          </button>
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

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AuthStatus />
        {children}
      </main>

      <AuthDialog open={authOpen} mode={authMode} onOpenChange={setAuthOpen} />
    </div>
  );
}

function AuthStatus() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="flex items-center justify-end gap-3 border-b border-border px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium truncate">{user.name}</div>
        <button
          onClick={() => logout()}
          className="rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
