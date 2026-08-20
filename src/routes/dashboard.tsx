import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowUpRight, Boxes, CheckCircle2, Gauge, Layers3, ShieldAlert, TrendingUp, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TITLE = "Dashboard — ArchGuard AI";
const DESCRIPTION = "Track architecture scores, open rule violations and review activity across every cloud project you own.";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: TITLE }, { name: "description", content: DESCRIPTION }, { property: "og:title", content: TITLE }, { property: "og:description", content: DESCRIPTION }] }),
  component: DashboardPage,
});

const STATS = [
  { label: "Active architectures", value: "12", icon: Boxes, delta: "+3 this month", tone: "blue" },
  { label: "Average score", value: "82", icon: TrendingUp, delta: "+6 vs last review", tone: "green" },
  { label: "Open critical findings", value: "4", icon: ShieldAlert, delta: "2 security, 2 availability", tone: "red" },
  { label: "Reviews run", value: "148", icon: Workflow, delta: "deterministic, reproducible", tone: "amber" },
];

const RECENT = [
  { name: "E-Commerce Platform Architecture", meta: "AWS • Microservices • 10M+ Users", score: 87, level: "Enterprise Ready", cloud: "AWS", color: "bg-orange-500/10 text-orange-600 dark:text-orange-300" },
  { name: "Retail Banking Core", meta: "Azure • Layered • 1M+ Users", score: 74, level: "Startup Ready", cloud: "Azure", color: "bg-sky-500/10 text-sky-600 dark:text-sky-300" },
  { name: "Telemetry Ingestion Pipeline", meta: "GCP • Event-Driven • 10M+ Users", score: 91, level: "FAANG-Scale", cloud: "GCP", color: "bg-blue-500/10 text-blue-600 dark:text-blue-300" },
];

const MATURITY = [
  { label: "Beginner", range: "Below 45", width: "w-[28%]", color: "bg-slate-400" },
  { label: "Startup Ready", range: "45–67", width: "w-[48%]", color: "bg-amber-400" },
  { label: "Production Ready", range: "68–81", width: "w-[66%]", color: "bg-sky-400" },
  { label: "Enterprise Ready", range: "82–91", width: "w-[84%]", color: "bg-emerald-500" },
  { label: "FAANG-Scale Architecture", range: "92+", width: "w-full", color: "bg-primary" },
];

function DashboardPage() {
  return <AppShell><PageHeader title="Dashboard" subtitle="Architecture health across all projects" actions={<Button asChild size="sm"><Link to="/designer">New architecture</Link></Button>} /><div className="flex-1 overflow-y-auto bg-muted/20 p-3 sm:p-4"><div className="mx-auto max-w-6xl space-y-3"><OverviewHero /><div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">{STATS.map((stat) => <StatCard key={stat.label} stat={stat} />)}</div><RecentArchitectures /><div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]"><ScoringCard /><MaturityCard /></div></div></div></AppShell>;
}

function OverviewHero() {
  return <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-4 shadow-sm sm:p-5"><div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" /><div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary"><Activity className="size-3.5" /> System pulse</div><h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Your architecture portfolio is healthy.</h2><p className="mt-1.5 max-w-xl text-[13px] leading-6 text-muted-foreground">Twelve active architectures are being tracked. Your portfolio average is above the Enterprise Ready threshold.</p><Button asChild variant="outline" size="sm" className="mt-3"><Link to="/projects">Review all projects <ArrowUpRight className="size-3.5" /></Link></Button></div><div className="flex shrink-0 items-center gap-3 rounded-xl border border-border bg-background/60 p-3 backdrop-blur"><ScoreRing score={82} /><div><div className="text-[11px] text-muted-foreground">Portfolio score</div><div className="mt-1 text-sm font-semibold">Enterprise Ready</div><div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400"><TrendingUp className="size-3" /> 6 points this cycle</div></div></div></div></section>;
}

function ScoreRing({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(10);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplayScore(score);
      return;
    }

    const start = performance.now();
    const duration = 750;
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(10 + (score - 10) * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return <div aria-label={`Portfolio score ${displayScore} out of 100`} className="relative flex size-[64px] items-center justify-center rounded-full transition-[background] duration-150" style={{ background: `conic-gradient(var(--primary) ${displayScore * 3.6}deg, color-mix(in oklab, var(--primary) 12%, transparent) 0deg)` }}><div className="flex size-[52px] items-center justify-center rounded-full bg-card text-lg font-semibold tracking-tight">{displayScore}</div></div>;
}

function StatCard({ stat }: { stat: (typeof STATS)[number] }) {
  const tones: Record<string, string> = { blue: "bg-sky-500/10 text-sky-600 dark:text-sky-300", green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300", red: "bg-red-500/10 text-red-600 dark:text-red-300", amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300" };
  return <section className="rounded-xl border border-border bg-card p-3.5 shadow-sm transition-transform hover:-translate-y-0.5"><div className="flex items-start justify-between gap-3"><div><div className="text-[11px] text-muted-foreground">{stat.label}</div><div className="mt-1.5 text-2xl font-semibold tracking-tight">{stat.value}</div></div><div className={cn("flex size-8 items-center justify-center rounded-lg", tones[stat.tone])}><stat.icon className="size-3.5" /></div></div><div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className={cn("size-1.5 rounded-full", stat.tone === "red" ? "bg-red-500" : "bg-emerald-500")} />{stat.delta}</div></section>;
}

function RecentArchitectures() {
  return <section className="rounded-2xl border border-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><Layers3 className="size-3.5 text-primary" /> Portfolio</div><h2 className="mt-1 text-base font-semibold">Recent architectures</h2></div><Link to="/projects" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">View all <ArrowUpRight className="size-3" /></Link></div><div className="divide-y divide-border">{RECENT.map((project) => <div key={project.name} className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold", project.color)}>{project.cloud}</div><div className="min-w-0"><div className="truncate text-sm font-medium">{project.name}</div><div className="mt-1 truncate text-xs text-muted-foreground">{project.meta}</div></div></div><div className="flex items-center justify-between gap-4 pl-12 sm:justify-end sm:pl-0"><Badge variant="outline" className="border-border text-[11px] text-muted-foreground">{project.level}</Badge><div className="flex items-center gap-2"><div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-muted sm:block"><div className={cn("h-full rounded-full", project.score >= 90 ? "bg-primary" : project.score >= 82 ? "bg-emerald-500" : "bg-amber-400")} style={{ width: `${project.score}%` }} /></div><span className="min-w-7 text-right text-sm font-semibold text-primary">{project.score}</span><ArrowUpRight className="size-3.5 text-muted-foreground" /></div></div></div>)}</div></section>;
}

function ScoringCard() {
  return <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><CheckCircle2 className="size-4" /></div><div><h2 className="text-sm font-semibold">How scoring works</h2><p className="mt-1 text-xs text-muted-foreground">Transparent by design. Reproducible by default.</p></div></div><p className="mt-5 text-sm leading-7 text-muted-foreground">A deterministic rule engine evaluates your architecture graph against the rule set that matches your pattern, scale, industry and cloud. Every category score comes from weighted rule outcomes — never from a language model. Explanations interpret those findings.</p><Button asChild variant="outline" size="sm" className="mt-5"><Link to="/knowledge">Open Knowledge Hub <ArrowUpRight className="size-3.5" /></Link></Button></section>;
}

function MaturityCard() {
  return <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Gauge className="size-4" /></div><div><h2 className="text-sm font-semibold">Maturity levels</h2><p className="mt-1 text-xs text-muted-foreground">Where each architecture sits on the scale.</p></div></div><div className="mt-5 space-y-3">{MATURITY.map((level) => <div key={level.label} className="flex items-center gap-3"><div className="min-w-0 flex-1"><div className="flex justify-between gap-2 text-[11px]"><span className="truncate font-medium">{level.label}</span><span className="shrink-0 text-muted-foreground">{level.range}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", level.color, level.width)} /></div></div></div>)}</div></section>;
}
