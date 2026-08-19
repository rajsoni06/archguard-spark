import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Database,
  Gauge,
  Globe,
  PiggyBank,
  Server,
  Shield,
  ShieldCheck,
  Scale,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const TITLE = "ArchGuard AI — Design Better. Build Safer. Scale Smarter.";
const DESCRIPTION =
  "ArchGuard AI is an intelligent cloud architecture design and security review platform: drag-and-drop AWS, Azure and GCP designs, deterministic scoring, cost estimation and AI explanations.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Workflow,
    title: "Architecture Designer",
    body: "Design cloud architectures visually using drag-and-drop components, boundaries and connections.",
  },
  {
    icon: Shield,
    title: "Security Review",
    body: "Identify security weaknesses and missing controls before they reach production.",
  },
  {
    icon: Scale,
    title: "Scalability Analysis",
    body: "Evaluate whether your architecture matches the workload you actually expect.",
  },
  {
    icon: Bot,
    title: "AI Recommendations",
    body: "AI explains every rule-engine finding and turns it into actionable remediation steps.",
  },
  {
    icon: Gauge,
    title: "Architecture Scoring",
    body: "Deterministic quality scores calculated from your pattern, scale, industry and priority.",
  },
  {
    icon: PiggyBank,
    title: "Cost Optimization",
    body: "Estimate monthly cloud spend per component and surface concrete savings opportunities.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Hub",
    body: "Learn system design, reliability, replication, security and cost engineering in context.",
  },
];

const FLOW = [
  { label: "Users", icon: Users },
  { label: "CloudFront", icon: Globe },
  { label: "WAF", icon: Shield },
  { label: "Load Balancer", icon: Scale },
  { label: "API Gateway", icon: Workflow },
  { label: "Backend Services", icon: Server },
  { label: "Redis", icon: Gauge },
  { label: "Database", icon: Database },
];

function Landing() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      {/* ambient gradient field */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[820px] opacity-70"
        style={{
          background:
            "radial-gradient(60% 55% at 20% 0%, color-mix(in oklab, var(--primary) 26%, transparent), transparent 70%), radial-gradient(50% 45% at 85% 10%, color-mix(in oklab, var(--info) 22%, transparent), transparent 72%)",
        }}
      />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <ShieldCheck className="size-5" />
          </div>
          <span className="truncate text-base font-semibold tracking-tight">ArchGuard AI</span>
        </div>
        <nav className="flex shrink-0 items-center gap-2 text-sm">
          <Link
            to="/knowledge"
            className="hidden rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Knowledge Hub
          </Link>
          {user ? (
            <Link
              to="/dashboard"
              className="rounded-lg border border-border bg-card/70 px-3.5 py-2 font-medium backdrop-blur transition-colors hover:bg-accent"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-lg border border-border bg-card/70 px-3.5 py-2 font-medium backdrop-blur transition-colors hover:bg-accent"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[12px] font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="size-3.5 text-primary" />
              Rule engine decides. AI explains.
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
              Design Better.
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(100deg, var(--primary), color-mix(in oklab, var(--info) 80%, var(--primary)))",
                }}
              >
                Build Safer. Scale Smarter.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              An intelligent architecture design and security review platform that helps software
              engineers design, analyze, optimize and understand modern cloud architectures across
              AWS, Azure and Google Cloud.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/designer"
                className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5"
                style={{
                  backgroundImage:
                    "linear-gradient(100deg, var(--primary), color-mix(in oklab, var(--info) 65%, var(--primary)))",
                }}
              >
                Start Designing
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/knowledge"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-5 py-3 text-sm font-medium backdrop-blur transition-colors hover:bg-accent"
              >
                <BookOpen className="size-4" /> Explore Knowledge Hub
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {[
                ["6", "Score categories"],
                ["3", "Cloud providers"],
                ["100%", "Deterministic scoring"],
              ].map(([v, k]) => (
                <div key={k} className="rounded-xl border border-border bg-card/50 p-3 backdrop-blur">
                  <dt className="text-lg font-semibold tracking-tight">{v}</dt>
                  <dd className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dd>
                </div>
              ))}
            </dl>
          </div>

          <FlowVisual />
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything you need to defend an architecture
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            From the first component you drop on the canvas to the final review report.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="group rounded-2xl border border-border bg-card/60 p-5 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              >
                <div className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/25">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </div>

          <div
            className="mt-14 overflow-hidden rounded-3xl border border-border p-8 text-center backdrop-blur sm:p-12"
            style={{
              backgroundImage:
                "linear-gradient(120deg, color-mix(in oklab, var(--primary) 14%, transparent), color-mix(in oklab, var(--info) 12%, transparent))",
            }}
          >
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready to review your first architecture?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Pick a cloud, a pattern and a scale — ArchGuard AI does the rest.
            </p>
            <Link
              to="/designer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Start Designing <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border py-6 text-center text-xs text-muted-foreground">
        ArchGuard AI — Intelligent Architecture Design &amp; Security Review Platform
      </footer>
    </div>
  );
}

function FlowVisual() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[36px] opacity-60 blur-2xl"
        style={{
          background:
            "linear-gradient(140deg, color-mix(in oklab, var(--primary) 30%, transparent), transparent 60%)",
        }}
      />
      <div className="relative rounded-3xl border border-border bg-card/60 p-5 backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Reference request flow
          </span>
          <span className="flex gap-1.5">
            {["var(--destructive)", "var(--warning)", "var(--success)"].map((c) => (
              <span key={c} className="size-2 rounded-full" style={{ background: c }} />
            ))}
          </span>
        </div>
        <ol className="space-y-2">
          {FLOW.map((step, i) => (
            <li key={step.label}>
              <div
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-3 py-2.5"
                style={{ animation: `archflow-pulse 3.6s ease-in-out ${i * 0.28}s infinite` }}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                  <step.icon className="size-4" />
                </span>
                <span className="truncate text-[13px] font-medium">{step.label}</span>
              </div>
              {i < FLOW.length - 1 ? (
                <span className="mx-auto my-0.5 block h-3 w-px bg-primary/40" aria-hidden />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
