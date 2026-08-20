import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Boxes, Cloud, FolderKanban, Plus, ShieldCheck, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PAGE_META } from "@/lib/pageMeta";

const meta = PAGE_META["projects"]!;

const PROJECTS = [
  { name: "E-Commerce Platform Architecture", cloud: "AWS", pattern: "Microservices", scale: "10M+ Users", score: 87, level: "Enterprise Ready", color: "orange" },
  { name: "Retail Banking Core", cloud: "Azure", pattern: "Layered", scale: "1M+ Users", score: 74, level: "Production Ready", color: "sky" },
  { name: "Telemetry Ingestion Pipeline", cloud: "GCP", pattern: "Event-Driven", scale: "10M+ Users", score: 91, level: "Enterprise Ready", color: "blue" },
  { name: "Internal Admin Console", cloud: "AWS", pattern: "Monolithic", scale: "10K Users", score: 58, level: "Startup Ready", color: "orange" },
];

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: meta.title }, { name: "description", content: meta.description }, { property: "og:title", content: meta.title }, { property: "og:description", content: meta.description }] }),
  component: Page,
});

function Page() {
  const average = Math.round(PROJECTS.reduce((total, project) => total + project.score, 0) / PROJECTS.length);
  return <AppShell><PageHeader title={meta.heading} subtitle={meta.subtitle} actions={<Button asChild size="sm"><Link to="/designer"><Plus className="size-3.5" /> New architecture</Link></Button>} /><div className="flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-6"><div className="mx-auto max-w-6xl space-y-5"><PortfolioSummary average={average} /><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Architecture portfolio</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Your reviewed systems</h2></div><span className="text-xs text-muted-foreground">{PROJECTS.length} active projects</span></div><div className="grid gap-4 md:grid-cols-2">{PROJECTS.map((project) => <ProjectCard key={project.name} project={project} />)}</div></div></div></AppShell>;
}

function PortfolioSummary({ average }: { average: number }) {
  return <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-5 shadow-sm sm:p-7"><div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" /><div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><FolderKanban className="size-3.5" /> Portfolio overview</div><h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Every architecture, one clear signal.</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Review the latest deterministic score, maturity level, and cloud context for every system you own.</p><Button asChild variant="outline" size="sm" className="mt-5"><Link to="/designer">Design a new architecture <ArrowUpRight className="size-3.5" /></Link></Button></div><div className="grid grid-cols-2 gap-2 sm:w-64"><SummaryMetric icon={Boxes} label="Active" value={String(PROJECTS.length)} /><SummaryMetric icon={TrendingUp} label="Average score" value={String(average)} /><SummaryMetric icon={ShieldCheck} label="Enterprise ready" value="2" /><SummaryMetric icon={Cloud} label="Clouds covered" value="3" /></div></div></section>;
}

function SummaryMetric({ icon: Icon, label, value }: { icon: typeof Boxes; label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-background/60 p-3 backdrop-blur"><div className="flex items-center gap-2"><Icon className="size-5 shrink-0 text-primary" /><div className="text-xl font-semibold tracking-tight">{value}</div></div><div className="mt-1 text-[10px] text-muted-foreground">{label}</div></div>;
}

function ProjectCard({ project }: { project: (typeof PROJECTS)[number] }) {
  const scoreColor = project.score >= 82 ? "text-emerald-600 dark:text-emerald-400" : project.score >= 68 ? "text-sky-600 dark:text-sky-400" : "text-amber-600 dark:text-amber-400";
  const barColor = project.score >= 82 ? "bg-emerald-500" : project.score >= 68 ? "bg-sky-500" : "bg-amber-500";
  const cloudColor = project.color === "sky" ? "bg-sky-500/10 text-sky-600 dark:text-sky-300" : project.color === "blue" ? "bg-blue-500/10 text-blue-600 dark:text-blue-300" : "bg-orange-500/10 text-orange-600 dark:text-orange-300";
  return <article className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold", cloudColor)}>{project.cloud}</div><div className="min-w-0"><h3 className="truncate text-sm font-semibold tracking-tight">{project.name}</h3><div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><span>{project.pattern}</span><span className="text-border">•</span><span>{project.scale}</span></div></div></div><ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" /></div><div className="mt-6 flex items-end justify-between gap-4"><div><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Last rule-engine score</div><div className={cn("mt-1 text-3xl font-semibold tracking-tight", scoreColor)}>{project.score}<span className="text-base text-muted-foreground"> / 100</span></div></div><span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">{project.level}</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${project.score}%` }} /></div><div className="mt-4 flex items-center justify-between"><span className="text-[11px] text-muted-foreground">Deterministic review</span><Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-primary"><Link to="/designer">Open designer <ArrowUpRight className="size-3" /></Link></Button></div></article>;
}
