import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  HardDrive,
  Server,
  Wifi,
  Zap,
  ZapOff,
  X,
  Activity,
} from "lucide-react";
import type { ArchGraph } from "@/lib/ruleEngine";
import { cn } from "@/lib/utils";

interface FailureScenario {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Caps that represent the failed component type */
  targets: string[];
  color: string;
}

const SCENARIOS: FailureScenario[] = [
  {
    id: "backend",
    label: "Kill Backend Instance",
    description: "Simulates a compute instance crash or deployment failure.",
    icon: Server,
    targets: ["compute"],
    color: "var(--destructive)",
  },
  {
    id: "database",
    label: "Database Failure",
    description: "Primary database goes offline — no reads or writes.",
    icon: Database,
    targets: ["database", "managed-database", "nosql"],
    color: "var(--destructive)",
  },
  {
    id: "cache",
    label: "Cache (Redis) Failure",
    description: "In-memory cache becomes unavailable — all reads fall through to DB.",
    icon: HardDrive,
    targets: ["cache"],
    color: "var(--warning)",
  },
  {
    id: "az",
    label: "Availability Zone Failure",
    description: "Entire AZ loses power, network and cooling simultaneously.",
    icon: Activity,
    targets: ["compute", "database", "cache", "load-balancer"],
    color: "var(--destructive)",
  },
  {
    id: "queue",
    label: "Message Queue Failure",
    description: "Queue broker becomes unavailable — async workers starve.",
    icon: Wifi,
    targets: ["queue", "pubsub", "streaming"],
    color: "var(--warning)",
  },
  {
    id: "lb",
    label: "Load Balancer Failure",
    description: "Traffic entry point goes down — all traffic is blocked.",
    icon: Zap,
    targets: ["load-balancer"],
    color: "var(--destructive)",
  },
];

interface ImpactLevel {
  level: "critical" | "high" | "medium" | "low" | "none";
  label: string;
  description: string;
}

function assessImpact(scenario: FailureScenario, graph: ArchGraph): ImpactLevel {
  const affected = graph.nodes.filter((n) =>
    n.caps.some((c) => scenario.targets.includes(c))
  );
  const hasLB = graph.nodes.some((n) => n.caps.includes("load-balancer"));
  const hasCache = graph.nodes.some((n) => n.caps.includes("cache"));
  const hasMultiCompute = graph.nodes.filter((n) => n.caps.includes("compute")).length >= 2;
  const hasAutoscaling = graph.nodes.some((n) => n.caps.includes("autoscaling"));
  const hasServerless = graph.nodes.some((n) => n.caps.includes("serverless"));

  if (affected.length === 0) {
    return { level: "none", label: "Not Affected", description: "No components of this type exist in the architecture." };
  }

  if (scenario.id === "backend") {
    if (hasMultiCompute || hasAutoscaling || hasServerless) {
      return { level: "low", label: "Minimal Impact", description: "Load balancer redirects traffic to healthy instances. Auto scaling replaces the failed instance." };
    }
    return { level: "critical", label: "Full Outage", description: "Single backend instance — SPOF. All traffic fails with no failover path." };
  }

  if (scenario.id === "database") {
    const hasReplica = graph.nodes.filter((n) => n.caps.includes("database")).length >= 2;
    const hasManagedDb = graph.nodes.some((n) => n.caps.includes("managed-database"));
    if (hasReplica || hasManagedDb) {
      return { level: "medium", label: "Partial Degradation", description: "Managed HA or replica promotes automatically. Expect 30–60s of connection errors during failover." };
    }
    return { level: "critical", label: "Data Tier Outage", description: "Single database — complete read/write outage. No data tier redundancy detected." };
  }

  if (scenario.id === "cache") {
    if (hasCache) {
      return { level: "high", label: "Performance Degradation", description: "All reads fall through to the database. Expect 5–10× latency increase and potential DB overload." };
    }
    return { level: "none", label: "Not Affected", description: "No cache layer in this architecture." };
  }

  if (scenario.id === "az") {
    const azNodes = graph.nodes.filter((n) => n.boundary === "az");
    if (azNodes.length >= 2) {
      return { level: "medium", label: "Partial Degradation", description: "Traffic redirected to surviving AZ. Capacity temporarily reduced. Database failover may add 30–60s downtime." };
    }
    return { level: "critical", label: "Full AZ Outage", description: "No multi-AZ deployment. A single AZ failure brings down the entire architecture." };
  }

  if (scenario.id === "queue") {
    const hasQueue = graph.nodes.some((n) => n.caps.includes("queue") || n.caps.includes("pubsub"));
    if (!hasQueue) return { level: "none", label: "Not Affected", description: "No async queues in this architecture." };
    return { level: "high", label: "Async Processing Halted", description: "Workers stop receiving messages. Synchronous paths remain up but background jobs back up." };
  }

  if (scenario.id === "lb") {
    if (!hasLB) return { level: "none", label: "Not Affected", description: "No load balancer detected. Direct traffic paths may still work." };
    return { level: "critical", label: "Traffic Blocked", description: "All inbound traffic is blocked. No traffic can reach the backend services." };
  }

  return { level: "medium", label: "Unknown Impact", description: "Impact depends on architecture specifics." };
}

const IMPACT_STYLES: Record<string, string> = {
  critical: "border-destructive/40 bg-destructive/8 text-destructive",
  high: "border-orange-400/40 bg-orange-50/60 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  medium: "border-warning/40 bg-warning/8 text-yellow-700 dark:text-yellow-400",
  low: "border-success/40 bg-success/8 text-green-700 dark:text-green-400",
  none: "border-border bg-muted/40 text-muted-foreground",
};

const IMPACT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  critical: ZapOff,
  high: AlertTriangle,
  medium: AlertTriangle,
  low: CheckCircle2,
  none: CheckCircle2,
};

interface Props {
  graph: ArchGraph;
  onClose: () => void;
}

export function FailureSimulator({ graph, onClose }: Props) {
  const [active, setActive] = useState<string | null>(null);

  const activeScenario = SCENARIOS.find((s) => s.id === active) ?? null;
  const impact = activeScenario ? assessImpact(activeScenario, graph) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-destructive/12 text-destructive">
              <ZapOff className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Failure Simulation</h2>
              <p className="text-[11px] text-muted-foreground">Select a failure scenario to see the impact on your architecture</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-[1fr_1fr]">
          {/* Scenario list */}
          <div className="space-y-2">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Choose scenario
            </p>
            {SCENARIOS.map((s) => {
              const ScenarioIcon = s.icon;
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(isActive ? null : s.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
                    isActive
                      ? "border-primary/50 bg-primary/8 ring-1 ring-primary/25"
                      : "border-border hover:border-primary/30 hover:bg-accent/50"
                  )}
                >
                  <span
                    className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${s.color} 12%, transparent)`,
                      color: s.color,
                    }}
                  >
                    <ScenarioIcon className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{s.label}</div>
                    <div className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                      {s.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Impact panel */}
          <div className="flex flex-col">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Impact Analysis
            </p>
            {!active ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
                <ZapOff className="mb-3 size-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Select a failure scenario on the left</p>
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-3">
                {impact && (
                  <div className={cn("rounded-xl border p-4", IMPACT_STYLES[impact.level])}>
                    {(() => {
                      const ImpactIcon = IMPACT_ICONS[impact.level]!;
                      return (
                        <div className="flex items-start gap-2.5">
                          <ImpactIcon className="mt-0.5 size-4 shrink-0" />
                          <div>
                            <div className="text-sm font-semibold">{impact.label}</div>
                            <div className="mt-1 text-[12px] leading-relaxed opacity-90">
                              {impact.description}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Affected components */}
                {activeScenario && (
                  <div className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Affected Components
                    </p>
                    {graph.nodes
                      .filter((n) => n.caps.some((c) => activeScenario.targets.includes(c)))
                      .length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">None — component type not in architecture</p>
                    ) : (
                      <div className="space-y-1">
                        {graph.nodes
                          .filter((n) => n.caps.some((c) => activeScenario.targets.includes(c)))
                          .map((n) => (
                            <div
                              key={n.id}
                              className="flex items-center gap-2 rounded-lg bg-destructive/8 border border-destructive/20 px-2.5 py-1.5"
                            >
                              <span className="size-2 rounded-full bg-destructive" />
                              <span className="text-[11px] font-medium text-destructive">{n.label}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Mitigation */}
                {activeScenario && impact && impact.level !== "none" && (
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Mitigation
                    </p>
                    <p className="text-[11px] leading-relaxed text-foreground">
                      {active === "backend" && "Add a second compute instance and an auto scaling group. The load balancer will route around failed instances automatically."}
                      {active === "database" && "Enable Multi-AZ deployment or add a managed replica. Test failover by deliberately failing the primary in staging."}
                      {active === "cache" && "Implement graceful degradation — fall through to the database on cache miss. Add a cache health check and circuit breaker."}
                      {active === "az" && "Spread every tier across at least two AZs. Use managed services that handle AZ failover automatically."}
                      {active === "queue" && "Use a managed queue service with built-in redundancy. Add a dead-letter queue and retry policy for failed messages."}
                      {active === "lb" && "Use a managed load balancer — all major cloud providers guarantee 99.99%+ uptime on their managed LB products."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
