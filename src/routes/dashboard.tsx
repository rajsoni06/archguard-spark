import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Boxes, ShieldAlert, TrendingUp, Workflow } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TITLE = "Dashboard — ArchGuard AI";
const DESCRIPTION =
  "Track architecture scores, open rule violations and review activity across every cloud project you own.";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: DashboardPage,
});

const STATS = [
  { label: "Active architectures", value: "12", icon: Boxes, delta: "+3 this month" },
  { label: "Average score", value: "82", icon: TrendingUp, delta: "+6 vs last review" },
  { label: "Open critical findings", value: "4", icon: ShieldAlert, delta: "2 security, 2 availability" },
  { label: "Reviews run", value: "148", icon: Workflow, delta: "deterministic, reproducible" },
];

const RECENT = [
  { name: "E-Commerce Platform Architecture", meta: "AWS • Microservices • 10M+ Users", score: 87, level: "Enterprise Ready" },
  { name: "Retail Banking Core", meta: "Azure • Layered • 1M+ Users", score: 74, level: "Startup Ready" },
  { name: "Telemetry Ingestion Pipeline", meta: "GCP • Event-Driven • 10M+ Users", score: 91, level: "FAANG Scale" },
];

function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        subtitle="Architecture health across all projects"
        actions={
          <Button asChild size="sm">
            <Link to="/">New architecture</Link>
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <stat.icon className="size-4 text-primary" />
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight">{stat.value}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{stat.delta}</div>
              </div>
            ))}
          </div>

          <section className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Recent architectures</h2>
              <Link to="/projects" className="flex items-center gap-1 text-xs text-primary hover:underline">
                View all <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {RECENT.map((p) => (
                <div key={p.name} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.meta}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      {p.level}
                    </Badge>
                    <span className="text-sm font-semibold text-primary">{p.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">How scoring works</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                A deterministic rule engine evaluates your architecture graph against the rule set that
                matches your pattern, scale, industry and cloud. Every category score comes from weighted
                rule outcomes — never from a language model. Explanations interpret those findings.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/knowledge">Open Knowledge Hub</Link>
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Maturity levels</h2>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>Beginner — below 45</li>
                <li>Startup Ready — 45 to 67</li>
                <li>Production Ready — 68 to 81</li>
                <li>Enterprise Ready — 82 to 91</li>
                <li>FAANG-Scale Architecture — 92 and above</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}