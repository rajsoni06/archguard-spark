import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Activity,
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
  CheckCircle2,
  Users,
  Workflow,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import AuthDialog from "@/components/ui/auth-modal";

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
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const year = new Date().getFullYear();
  const [authOpen, setAuthOpen] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<"login" | "signup">("login");

  return (
    <div className="home-page relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      <div className="home-ambient" aria-hidden>
        <div className="home-grid" />
        <span className="home-orb home-orb-one" />
        <span className="home-orb home-orb-two" />
        <span className="home-orb home-orb-three" />
      </div>

      <header className="home-reveal is-visible relative z-30 mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src="/ArchGuard_Logo.png" alt="ArchGuard Logo" className="h-12 w-auto object-contain" />
          <span className="truncate text-base font-semibold tracking-tight">ArchGuard AI</span>
        </div>
        <nav className="flex shrink-0 items-center gap-2 text-sm">
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="hidden rounded-lg px-2.5 py-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/30 sm:flex items-center justify-center"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-lg border border-border bg-card/70 px-3.5 py-2 font-medium backdrop-blur transition-colors hover:bg-accent"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-2">
                <div className="hidden text-sm text-muted-foreground sm:block">{user.name}</div>
                <button
                  onClick={() => logout()}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/20 transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent/20 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setAuthMode("signup");
                  setAuthOpen(true);
                }}
                className="cursor-pointer rounded-lg px-3.5 py-2 font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 shadow-sm hover:bg-indigo-100 transition-colors"
              >
                Sign Up
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-4 lg:-mt-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-0">
          <div>
            <span className="home-reveal is-visible home-reveal-delay-1 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/60 px-3 py-1.5 text-[12px] font-medium text-muted-foreground shadow-sm backdrop-blur-xl">
              <span className="home-live-dot" />
              <Sparkles className="size-3.5 text-primary" />
              Rule engine decides · AI explains
            </span>
            <h1 className="home-reveal is-visible home-reveal-delay-2 mt-5 max-w-3xl text-3xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-4xl lg:text-[3.25rem]">
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
            <p className="home-reveal is-visible home-reveal-delay-3 mt-6 max-w-xl text-[15px] leading-7 text-muted-foreground sm:text-base">
              An intelligent architecture design and security review platform that helps software
              engineers design, analyze, optimize and understand modern cloud architectures across
              AWS, Azure and Google Cloud.
            </p>
            <div className="home-reveal is-visible home-reveal-delay-4 mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/designer"
                className="home-primary-button group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5"
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
                className="home-secondary-button inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-5 py-3 text-sm font-medium backdrop-blur transition-colors hover:bg-accent"
              >
                <BookOpen className="size-4" /> Explore Knowledge Hub
              </Link>
            </div>
            <dl className="home-reveal is-visible home-reveal-delay-5 mt-10 grid max-w-lg grid-cols-3 gap-2 sm:gap-4">
              {[
                ["6", "Score categories"],
                ["3", "Cloud providers"],
                ["100%", "Deterministic scoring"],
              ].map(([v, k]) => (
                <div
                  key={k}
                  className="home-stat rounded-xl border border-border bg-card/50 p-3 backdrop-blur"
                >
                  <dt className="text-lg font-semibold tracking-tight">{v}</dt>
                  <dd className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {k}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="home-reveal is-visible">
            <FlowVisual />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <Reveal>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary"><Activity className="size-3.5" /> Built for clarity</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Everything you need to defend an architecture</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">From the first component you drop on the canvas to the final review report.</p>
            </div>
          </Reveal>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, index) => (
              <Reveal key={f.title} className={`home-reveal-delay-${Math.min(index + 1, 5)}`}>
                <article className="home-feature-card group rounded-xl border border-border bg-card/60 p-4 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
                <div className="grid size-9 place-items-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25">
                  <f.icon className="size-4.5" />
                </div>
                <h3 className="mt-3 text-sm font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{f.body}</p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-primary transition-transform duration-200 group-hover:translate-x-0.5">Explore capability <ArrowUpRight className="size-3" /></div>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal>
          <div
            className="home-cta mt-14 overflow-hidden rounded-3xl border border-primary/20 p-8 text-center backdrop-blur sm:p-12"
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
          </Reveal>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border pt-6 pb-12 text-center text-sm text-gray-900 dark-footer">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-base font-medium text-gray-900">
            Made with ❤️ in India by{" "}
            <a
              href="https://www.linkedin.com/in/riya-saini-5096b9236/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 hover:underline hover:underline-offset-2"
            >
              Riya Saini
            </a>
            ,{" "}
            <a
              href="https://www.linkedin.com/in/raj-anand-soni-037541212"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 hover:underline hover:underline-offset-2"
            >
              Raj Anand Soni
            </a>
            ,{" "}
            <a
              href="https://www.linkedin.com/in/praffulgoyl/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 hover:underline hover:underline-offset-2"
            >
              Prafful Goyal
            </a>
          </div>
          <div className="mt-1 text-gray-800">
            ArchGuard AI — Intelligent Architecture Design &amp; Security Review Platform
          </div>
          <div className="mt-4 text-[13px] text-gray-700">
            © {year} ArchGuard AI. All rights reserved.
          </div>
        </div>
      </footer>
      <AuthDialog open={authOpen} mode={authMode} onOpenChange={(v) => setAuthOpen(v)} />
    </div>
  );
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -36px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={`home-reveal ${visible ? "is-visible" : ""} ${className}`}>{children}</div>;
}

function FlowVisual() {
  return (
    <div className="home-flow-visual relative mx-auto w-full max-w-[310px] pt-6 lg:max-w-[350px] lg:pt-10">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[36px] opacity-60 blur-2xl"
        style={{
          background:
            "linear-gradient(140deg, color-mix(in oklab, var(--primary) 30%, transparent), transparent 60%)",
        }}
      />
      <div className="home-flow-card relative rounded-3xl border border-border bg-card/60 p-4 backdrop-blur-xl sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Activity className="size-3 text-primary" /> Reference request flow
            </span>
            <span className="mt-1 block text-[10px] text-muted-foreground/70">Production path · synchronous request</span>
          </div>
          <span className="home-trace-status"><span className="home-live-dot" /> LIVE TRACE</span>
        </div>
        <ol className="home-flow-list relative space-y-1.5">
          <span className="home-flow-rail" aria-hidden />
          {FLOW.map((step, i) => (
            <li key={step.label}>
              <div
                className="home-flow-step archflow-pulse group relative z-[1] flex items-center gap-2.5 rounded-lg border border-border/70 bg-background/60 px-2.5 py-2 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
                style={{ animationDelay: `${i * 0.28}s` }}
              >
                <span className="home-flow-icon grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary transition-transform group-hover:scale-110">
                  <step.icon className="size-3.5" />
                </span>
                <span className="truncate text-xs font-medium">{step.label}</span>
                <span className="ml-auto rounded-md bg-slate-200 px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-950">{String(i + 1).padStart(2, "0")}</span>
              </div>
              {i < FLOW.length - 1 ? (
                <span className="mx-auto my-0.5 block h-2 w-px bg-primary/40" aria-hidden />
              ) : null}
            </li>
          ))}
        </ol>
        <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-500" /> Flow validated</span>
          <span className="flex items-center gap-2"><span className="font-medium text-primary">8 components</span><span className="text-muted-foreground/50">·</span><span>42ms avg</span></span>
        </div>
      </div>
    </div>
  );
}
