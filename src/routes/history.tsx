import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowUpRight, CheckCircle2, Clock3, GitCompareArrows, History as HistoryIcon, ShieldCheck, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PAGE_META } from "@/lib/pageMeta";

const meta = PAGE_META["history"]!;
const REVIEWS = [
  { project: "E-Commerce Platform", version: "v14", change: "Added WAF and read replica", delta: 9, time: "Today", type: "Security + availability", score: "87 / 100" },
  { project: "E-Commerce Platform", version: "v13", change: "Moved RDS into private subnet", delta: 12, time: "3 days ago", type: "Network hardening", score: "78 / 100" },
  { project: "Banking Core", version: "v6", change: "Secrets Manager introduced", delta: 6, time: "1 week ago", type: "Security control", score: "74 / 100" },
  { project: "Telemetry Pipeline", version: "v3", change: "Removed duplicate gateway", delta: 2, time: "2 weeks ago", type: "Architecture cleanup", score: "91 / 100" },
];

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: meta.title }, { name: "description", content: meta.description }, { property: "og:title", content: meta.title }, { property: "og:description", content: meta.description }] }),
  component: Page,
});

function Page() {
  return <AppShell><PageHeader title={meta.heading} subtitle={meta.subtitle} actions={<Button asChild variant="outline" size="sm"><Link to="/designer">Run new review <ArrowUpRight className="size-3.5" /></Link></Button>} /><div className="flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-6"><div className="mx-auto max-w-5xl space-y-5"><HistoryHero /><div className="grid gap-3 sm:grid-cols-3"><Summary label="Reviews tracked" value="148" detail="Across all projects" icon={HistoryIcon} /><Summary label="Score movement" value="+29" detail="From recent changes" icon={TrendingUp} /><Summary label="Reproducibility" value="100%" detail="Same graph, same score" icon={CheckCircle2} /></div><Timeline /><DeterministicNote /></div></div></AppShell>;
}

function HistoryHero() {
  return <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-5 shadow-sm sm:p-7"><div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" /><div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><Activity className="size-3.5" /> Audit trail</div><h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Every design decision leaves a trace.</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Deterministic reviews are reproducible — the same graph always scores the same. Track exactly which changes moved your architecture forward.</p></div><div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground backdrop-blur"><ShieldCheck className="size-3.5 text-emerald-500" /> Immutable review record</div></div></section>;
}

function Summary({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof HistoryIcon }) {
  return <div className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{label}</span><Icon className="size-4 text-primary" /></div><div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div><div className="mt-1 text-[11px] text-muted-foreground">{detail}</div></div>;
}

function Timeline() {
  return <section className="rounded-2xl border border-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><GitCompareArrows className="size-3.5 text-primary" /> Version timeline</div><h2 className="mt-1 text-base font-semibold">Recent review changes</h2></div><span className="text-xs text-muted-foreground">Latest first</span></div><div className="p-4 sm:p-5">{REVIEWS.map((review, index) => <ReviewRow key={`${review.project}-${review.version}`} review={review} last={index === REVIEWS.length - 1} />)}</div></section>;
}

function ReviewRow({ review, last }: { review: (typeof REVIEWS)[number]; last: boolean }) {
  return <div className="relative flex gap-4 pb-5 last:pb-0"><div className="relative flex shrink-0 flex-col items-center"><div className="z-10 flex size-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><GitCompareArrows className="size-4" /></div>{!last ? <div className="absolute top-9 h-full w-px bg-border" /> : null}</div><div className="min-w-0 flex-1 rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:border-primary/40"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{review.project}</h3><span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{review.version}</span></div><p className="mt-1.5 text-sm text-foreground/80">{review.change}</p></div><div className="flex shrink-0 items-center gap-3"><div className="text-right"><div className={cn("text-lg font-semibold", review.delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>{review.delta > 0 ? "+" : ""}{review.delta}</div><div className="text-[10px] text-muted-foreground">score delta</div></div><div className="h-8 w-px bg-border" /><div className="text-right"><div className="text-sm font-semibold text-primary">{review.score}</div><div className="text-[10px] text-muted-foreground">result</div></div></div></div><div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground"><span className="rounded-full border border-border bg-background px-2 py-1">{review.type}</span><span className="flex items-center gap-1"><Clock3 className="size-3" /> {review.time}</span></div></div></div>;
}

function DeterministicNote() {
  return <section className="flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><CheckCircle2 className="size-4" /></div><div><h2 className="text-sm font-semibold">Why this history is trustworthy</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Every review is calculated from the architecture graph and weighted rule outcomes. The engine does not guess, randomize, or rewrite past results, so score movement can be traced back to a concrete design change.</p></div></section>;
}
