import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AtSign, CircleUserRound, IdCard, LogOut, Mail, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { PAGE_META } from "@/lib/pageMeta";

const meta = PAGE_META["profile"]!;

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: meta.title },
      { name: "description", content: meta.description },
      { property: "og:title", content: meta.title },
      { property: "og:description", content: meta.description },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <AppShell>
        <PageHeader title={meta.heading} subtitle={meta.subtitle} />
        <div className="flex flex-1 items-center justify-center bg-muted/20 p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
            <CircleUserRound className="mx-auto size-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Sign in to view your profile</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your account details will appear here after you sign in.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const initials = getInitials(user.name);
  const handleLogout = () => {
    // Reuse the app's existing auth session mechanism, then return to Home.
    logout();
    window.setTimeout(() => navigate({ to: "/" }), 0);
  };

  return (
    <AppShell>
      <PageHeader title={meta.heading} subtitle={meta.subtitle} />
      <div className="flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
          <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/80 via-primary/30 to-transparent" />
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-semibold text-primary-foreground shadow-sm ring-4 ring-primary/10 sm:size-20 sm:text-2xl" aria-label={`${user.name} avatar`}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your account</p>
                  <h1 className="mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl">{user.name}</h1>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground"><Mail className="size-3.5 shrink-0" />{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" />Authenticated account</div>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <SectionHeading icon={CircleUserRound} title="Personal information" description="Information currently available from your account." />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoItem icon={CircleUserRound} label="Full name" value={user.name} />
                <InfoItem icon={Mail} label="Email address" value={user.email} />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <SectionHeading icon={IdCard} title="Account" description="Your account identifier and session controls." />
              <div className="mt-5 space-y-3">
                <InfoItem icon={AtSign} label="Account ID" value={user.id} mono />
              </div>
              <LogoutButton onLogout={handleLogout} />
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return <button type="button" onClick={onLogout} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 px-3 py-2.5 text-sm font-medium text-destructive transition-all duration-200 hover:bg-destructive/10 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 motion-reduce:transition-none"><LogOut className="size-4" />Log out securely</button>;
}

function InfoItem({ icon: Icon, label, value, mono = false }: { icon: typeof Mail; label: string; value: string; mono?: boolean }) {
  return <div className="rounded-xl border border-border bg-muted/20 p-3"><div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground"><Icon className="size-3.5 text-primary" />{label}</div><div className={`mt-1.5 break-all text-sm text-foreground ${mono ? "font-mono text-xs" : "font-medium"}`}>{value}</div></div>;
}

function SectionHeading({ icon: Icon, title, description }: { icon: typeof Mail; title: string; description: string }) {
  return <div className="flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></div><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{description}</p></div></div>;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.slice(0, 3).map((part) => part[0]).join("").toUpperCase();
}
