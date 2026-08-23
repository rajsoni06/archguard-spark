import { createFileRoute } from "@tanstack/react-router";
import { Cloud, FileDown, Gauge, LogOut, Moon, Settings2, ShieldCheck, Sparkles, Sun, UserRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { PAGE_META } from "@/lib/pageMeta";

const meta = PAGE_META["settings"]!;
const SETTINGS_KEY = "archguard.settings";
type CloudProvider = "AWS" | "Azure" | "Google Cloud";
type ExplanationDetail = "Concise" | "Standard" | "Detailed";
type ExportFormat = "PNG" | "JPG" | "JSON";
interface SettingsState { cloud: CloudProvider; frameworks: string[]; passingScore: number; explanation: ExplanationDetail; exportFormat: ExportFormat; includeMetadata: boolean; }
const DEFAULT_SETTINGS: SettingsState = { cloud: "AWS", frameworks: ["PCI DSS", "SOC 2", "GDPR"], passingScore: 75, explanation: "Standard", exportFormat: "PNG", includeMetadata: true };
const FRAMEWORKS = ["PCI DSS", "SOC 2", "GDPR", "HIPAA", "ISO 27001"];

function loadSettings(): SettingsState {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}") }; } catch { return DEFAULT_SETTINGS; }
}

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: meta.title }, { name: "description", content: meta.description }, { property: "og:title", content: meta.title }, { property: "og:description", content: meta.description }] }),
  component: Page,
});

function Page() {
  const [settings, setSettings] = useState<SettingsState>(loadSettings);
  useEffect(() => { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);
  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => setSettings((current) => ({ ...current, [key]: value }));

  return (
    <AppShell>
      <PageHeader title={meta.heading} subtitle={meta.subtitle} />
      <div className="settings-page flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Control center</p><h1 className="mt-1 text-xl font-semibold tracking-tight">Defaults, rule thresholds and export preferences</h1><p className="mt-1 text-sm text-muted-foreground">Tune how new projects are reviewed and shared on this device.</p></div><div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex"><Settings2 className="size-3.5 text-primary" /> Saved locally</div></div>
          <Appearance />
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><SectionHeading icon={Cloud} title="Project defaults" description="Applied to every new project." /><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Default cloud provider" hint="Used when a project is created"><select value={settings.cloud} onChange={(e) => update("cloud", e.target.value as CloudProvider)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"><option>AWS</option><option>Azure</option><option>Google Cloud</option></select></Field><Field label="Explanation detail" hint="How verbose generated explanations are"><select value={settings.explanation} onChange={(e) => update("explanation", e.target.value as ExplanationDetail)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"><option>Concise</option><option>Standard</option><option>Detailed</option></select></Field></div></section>
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><SectionHeading icon={Gauge} title="Review thresholds" description="Control when a review is marked passing." /><div className="mt-5 rounded-xl border border-border bg-muted/30 p-4"><div className="flex items-end justify-between gap-3"><div><div className="text-sm font-medium">Minimum passing score</div><div className="mt-1 text-xs text-muted-foreground">Below this score a review is failing.</div></div><output className="text-2xl font-semibold tracking-tight text-primary">{settings.passingScore}</output></div><input aria-label="Minimum passing score" type="range" min="0" max="100" step="5" value={settings.passingScore} onChange={(e) => update("passingScore", Number(e.target.value))} className="mt-5 w-full accent-[var(--primary)]" /><div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>0</span><span>100</span></div></div></section>
          </div>
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><SectionHeading icon={ShieldCheck} title="Compliance frameworks" description="Checked during every architecture review." /><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{FRAMEWORKS.map((framework) => { const selected = settings.frameworks.includes(framework); return <button key={framework} type="button" aria-pressed={selected} onClick={() => update("frameworks", selected ? settings.frameworks.filter((item) => item !== framework) : [...settings.frameworks, framework])} className={cn("rounded-xl border px-3 py-3 text-left text-xs font-medium transition-colors", selected ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-accent hover:text-foreground")}><span className={cn("mr-2 inline-block size-2 rounded-full", selected ? "bg-primary" : "bg-muted-foreground/30")} />{framework}</button>; })}</div></section>
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><SectionHeading icon={FileDown} title="Export preferences" description="Choose the default format for architecture exports." /><div className="mt-5 flex flex-wrap gap-2">{(["PNG", "JPG", "JSON"] as ExportFormat[]).map((format) => <button key={format} type="button" onClick={() => update("exportFormat", format)} className={cn("rounded-lg border px-3 py-2 text-xs font-medium transition-colors", settings.exportFormat === format ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent hover:text-foreground")}>{format}</button>)}</div><label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-foreground/80"><input type="checkbox" checked={settings.includeMetadata} onChange={(e) => update("includeMetadata", e.target.checked)} className="size-4 accent-[var(--primary)]" /> Include project metadata in exports</label></section>
            <AccountCard />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Appearance() {
  const { theme, setTheme } = useTheme();
  const options = [{ id: "light" as const, label: "Light Mode", icon: Sun, description: "Bright and focused" }, { id: "dark" as const, label: "Dark Mode", icon: Moon, description: "Low-light friendly" }];
  return <section className="appearance-card rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"><div className="flex items-start justify-between gap-3"><SectionHeading icon={Sparkles} title="Appearance" description="Choose how ArchGuard AI looks." /><span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Saved locally</span></div><div className="mt-3 grid max-w-xl grid-cols-2 gap-2">{options.map((option) => { const selected = theme === option.id; return <button key={option.id} type="button" onClick={() => setTheme(option.id)} className={cn("flex min-w-0 items-center gap-2 rounded-xl border p-2.5 text-left transition-all hover:-translate-y-0.5", selected ? "border-primary/60 bg-primary/10 shadow-sm" : "border-border bg-background/50 hover:border-primary/30 hover:bg-accent/60")}><span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><option.icon className="size-3.5" /></span><span className="min-w-0"><span className="block truncate text-xs font-semibold">{option.label}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{option.description}</span></span></button>; })}</div></section>;
}

function AccountCard() {
  const { user, logout } = useAuth();
  return <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><SectionHeading icon={UserRound} title="Account" description="Manage the account used on this device." /><div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-3"><div className="min-w-0"><div className="truncate text-sm font-medium">{user?.name ?? "Not signed in"}</div><div className="truncate text-xs text-muted-foreground">{user?.email ?? "Sign in to sync your workspace"}</div></div><button type="button" onClick={() => logout()} disabled={!user} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"><LogOut className="size-3.5" /> Logout</button></div></section>;
}

function SectionHeading({ icon: Icon, title, description }: { icon: typeof Cloud; title: string; description: string }) {
  return <div className="flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></div><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{description}</p></div></div>;
}

function Field({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return <label className="block"><span className="text-xs font-medium">{label}</span><span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span><div className="mt-2">{children}</div></label>;
}
