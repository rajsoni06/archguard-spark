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

const CANVAS_THEME_STORAGE_KEY = "archguard-canvas-theme";
const CANVAS_THEME_EVENT = "archguard:canvas-theme-change";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authOpen, setAuthOpen] = useState(false);

  const toggleAppTheme = () => {
    const nextCanvasTheme = theme === "dark" ? "light" : "dark";
    toggleTheme();
    try {
      window.localStorage.setItem(CANVAS_THEME_STORAGE_KEY, nextCanvasTheme);
      window.dispatchEvent(
        new CustomEvent(CANVAS_THEME_EVENT, { detail: nextCanvasTheme }),
      );
    } catch {
      // Ignore storage/event failures in restricted environments.
    }
  };

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside className="archguard-sidebar hidden w-[var(--sidebar-width)] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex shrink-0 items-center justify-center">
            <img src="/ArchGuard_Logo.png" alt="ArchGuard Logo" className="sidebar-logo h-9 w-auto object-contain" />
          </div>
          <div className="leading-tight">
            <div className="sidebar-brand-title text-sm font-semibold tracking-tight">ArchGuard AI</div>
            <div className="sidebar-brand-subtitle text-[11px] text-muted-foreground">Architecture Review</div>
          </div>
        </div>

        <nav className="sidebar-nav min-h-0 flex-1 space-y-0.5 overflow-hidden px-2 py-2">
          {NAV.filter((item) => item.to !== "/profile" || Boolean(user)).map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "archguard-sidebar-link flex min-w-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "archguard-sidebar-link--active bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]"
                    : "text-sidebar-foreground/75",
                )}
              >
                <item.icon className={cn("size-4 shrink-0", active && "text-primary")} />
                <span className="min-w-0 whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => openAuth("login")}
            aria-current={authOpen && authMode === "login" ? "page" : undefined}
            className={cn(
              "archguard-sidebar-link flex w-full min-w-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
              authOpen && authMode === "login"
                ? "archguard-sidebar-link--active bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]"
                : "text-sidebar-foreground/75",
            )}
          >
            <LogIn className={cn("size-4 shrink-0", authOpen && authMode === "login" && "text-primary")} />
            <span className="whitespace-nowrap">Login</span>
          </button>
          <button
            type="button"
            onClick={() => openAuth("signup")}
            aria-current={authOpen && authMode === "signup" ? "page" : undefined}
            className={cn(
              "archguard-sidebar-link flex w-full min-w-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
              authOpen && authMode === "signup"
                ? "archguard-sidebar-link--active bg-primary/12 text-primary shadow-[inset_2px_0_0_0_var(--sidebar-primary)]"
                : "text-sidebar-foreground/75",
            )}
          >
            <UserPlus className={cn("size-4 shrink-0", authOpen && authMode === "signup" && "text-primary")} />
            <span className="whitespace-nowrap">Sign Up</span>
          </button>
        </nav>

        <div className="sidebar-theme px-2 pb-2">
          <button
            onClick={toggleAppTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="archguard-sidebar-link flex w-full min-w-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-sidebar-foreground/75 transition-colors"
          >
            {theme === "dark" ? <Sun className="size-4 shrink-0" /> : <Moon className="size-4 shrink-0" />}
            <span className="whitespace-nowrap">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>

        <div className="border-t border-sidebar-border p-3">
          <div className="archguard-sidebar-note rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
            <p className="text-[11px] leading-relaxed text-sidebar-foreground/80">
              <span className="font-medium text-sidebar-foreground/95">Rule Engine decides.</span> AI explains.
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
