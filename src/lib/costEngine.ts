import type { Capability, CloudId } from "./catalog";
import type { ProjectContext } from "./ruleEngine";

export interface CostGraphNode {
  id: string;
  serviceId: string;
  label: string;
  caps: Capability[];
}

export interface CostLine {
  label: string;
  amount: number;
  optimizable: boolean;
}

export interface CostRecommendation {
  title: string;
  detail: string;
  savings: number;
}

export interface CostEstimate {
  available: boolean;
  total: number;
  optimized: number;
  savings: number;
  unoptimized: number;
  deltaPercent: number;
  lines: CostLine[];
  assumptions: { label: string; value: string }[];
  recommendations: CostRecommendation[];
  currency: string;
}

/** Baseline monthly USD price per capability at ~10K users, per cloud. */
const BASE: Record<Capability, number> = {
  client: 0,
  dns: 8,
  cdn: 45,
  waf: 30,
  "load-balancer": 55,
  "reverse-proxy": 35,
  "api-gateway": 60,
  compute: 190,
  container: 210,
  serverless: 45,
  autoscaling: 0,
  cache: 80,
  database: 170,
  "managed-database": 40,
  sql: 170,
  nosql: 90,
  warehouse: 220,
  search: 120,
  "object-storage": 25,
  "block-storage": 30,
  archive: 8,
  queue: 15,
  pubsub: 18,
  streaming: 110,
  "event-bus": 25,
  etl: 100,
  "data-lake": 35,
  "data-catalog": 30,
  bi: 75,
  ml: 180,
  auth: 20,
  secrets: 6,
  encryption: 5,
  network: 45,
  "private-network": 0,
  monitoring: 40,
  tracing: 25,
  replication: 50,
  "read-replica": 80,
  "health-check": 0,
  failover: 25,
  storage: 25,
};

const CLOUD_FACTOR: Record<CloudId, number> = { aws: 1, azure: 0.97, gcp: 0.93 };

const SCALE_FACTOR: Record<string, number> = {
  "1K Users": 0.35,
  "10K Users": 1,
  "100K Users": 2.6,
  "1M+ Users": 6.2,
  "10M+ Users": 14,
};

const SCALE_TRAFFIC: Record<string, { requests: string; storage: string; db: string; transfer: string; instances: string }> = {
  "1K Users": { requests: "1M/month", storage: "50 GB", db: "20 GB", transfer: "100 GB/month", instances: "1 instance" },
  "10K Users": { requests: "10M/month", storage: "150 GB", db: "50 GB", transfer: "300 GB/month", instances: "2 instances" },
  "100K Users": { requests: "50M/month", storage: "300 GB", db: "120 GB", transfer: "700 GB/month", instances: "3 instances" },
  "1M+ Users": { requests: "200M/month", storage: "800 GB", db: "400 GB", transfer: "3 TB/month", instances: "6 instances" },
  "10M+ Users": { requests: "1B/month", storage: "3 TB", db: "1.5 TB", transfer: "15 TB/month", instances: "12 instances" },
};

/** Primary billable capability for a service (first match wins). */
const PRIORITY: Capability[] = [
  "compute",
  "container",
  "serverless",
  "database",
  "nosql",
  "cache",
  "streaming",
  "cdn",
  "load-balancer",
  "api-gateway",
  "waf",
  "object-storage",
  "block-storage",
  "archive",
  "monitoring",
  "tracing",
  "queue",
  "pubsub",
  "auth",
  "dns",
  "network",
  "secrets",
  "encryption",
];

const billableCap = (caps: Capability[]): Capability | undefined =>
  PRIORITY.find((c) => caps.includes(c));

const round = (n: number) => Math.round(n);

export function estimateCost(nodes: CostGraphNode[], ctx: ProjectContext): CostEstimate {
  const scale = SCALE_FACTOR[ctx.scale] ?? 1;
  const cloud = CLOUD_FACTOR[ctx.cloud] ?? 1;
  const traffic = SCALE_TRAFFIC[ctx.scale] ?? SCALE_TRAFFIC["10K Users"]!;

  const billable = nodes
    .map((n) => ({ node: n, cap: billableCap(n.caps) }))
    .filter((x): x is { node: CostGraphNode; cap: Capability } => Boolean(x.cap) && BASE[x.cap!] > 0);

  if (billable.length === 0) {
    return {
      available: false,
      total: 0,
      optimized: 0,
      savings: 0,
      unoptimized: 0,
      deltaPercent: 0,
      lines: [],
      assumptions: [],
      recommendations: [],
      currency: "USD",
    };
  }

  const hasElasticity = nodes.some((n) => n.caps.includes("autoscaling") || n.caps.includes("serverless"));

  const grouped = new Map<string, CostLine>();
  for (const { node, cap } of billable) {
    // Data-plane services scale with traffic, control-plane services scale less.
    const trafficSensitive = ["compute", "container", "database", "nosql", "cache", "cdn", "streaming", "load-balancer", "api-gateway", "object-storage"].includes(cap);
    const factor = trafficSensitive ? scale : 1 + (scale - 1) * 0.3;
    const amount = BASE[cap] * factor * cloud;
    const key = node.label;
    const existing = grouped.get(key);
    if (existing) existing.amount += amount;
    else
      grouped.set(key, {
        label: node.label,
        amount,
        optimizable: ["compute", "container", "network", "database", "cache", "streaming"].includes(cap),
      });
  }

  // Data transfer scales with traffic and edge/network components.
  const transfer = 18 * scale * cloud * (nodes.some((n) => n.caps.includes("cdn")) ? 0.6 : 1);
  grouped.set("Data Transfer", { label: "Data Transfer", amount: transfer, optimizable: true });

  const lines = [...grouped.values()].sort((a, b) => b.amount - a.amount).map((l) => ({ ...l, amount: round(l.amount) }));
  const total = lines.reduce((s, l) => s + l.amount, 0);

  const recommendations: CostRecommendation[] = [];
  const line = (match: string) => lines.find((l) => l.label.toLowerCase().includes(match));

  const nat = line("nat");
  if (nat) {
    recommendations.push({
      title: "NAT Gateway drives networking spend",
      detail: "Check whether every private subnet needs its own NAT Gateway, or whether VPC endpoints can absorb the traffic.",
      savings: round(nat.amount * 0.6),
    });
  }
  if (!hasElasticity) {
    const compute = lines.filter((l) => l.optimizable).reduce((s, l) => s + l.amount, 0);
    if (compute > 0)
      recommendations.push({
        title: "No elasticity in the compute tier",
        detail: "Add auto scaling or move burst workloads to serverless so idle capacity is not billed around the clock.",
        savings: round(compute * 0.22),
      });
  }
  if (!nodes.some((n) => n.caps.includes("archive"))) {
    recommendations.push({
      title: "All data sits in hot storage",
      detail: "Apply lifecycle rules so infrequently accessed objects move to an archive tier.",
      savings: round(total * 0.04),
    });
  }
  if (!nodes.some((n) => n.caps.includes("cdn"))) {
    recommendations.push({
      title: "Static traffic hits origin directly",
      detail: "Fronting the origin with a CDN cuts egress and compute usage for cacheable responses.",
      savings: round(total * 0.06),
    });
  }
  if (ctx.priority === "Cost Optimization") {
    recommendations.push({
      title: "Commit to reserved / committed-use capacity",
      detail: "Your project priority is cost optimization — 1-year commitments on steady-state compute and databases typically cut list price meaningfully.",
      savings: round(total * 0.15),
    });
  }

  const savings = Math.min(round(recommendations.reduce((s, r) => s + r.savings, 0)), round(total * 0.45));
  const optimized = Math.max(round(total - savings), 0);
  const unoptimized = round(total * 1.22);
  const deltaPercent = unoptimized > 0 ? Math.round(((unoptimized - total) / unoptimized) * 100) : 0;

  return {
    available: true,
    total,
    optimized,
    savings,
    unoptimized,
    deltaPercent,
    lines,
    assumptions: [
      { label: "Cloud", value: ctx.cloud.toUpperCase() },
      { label: "Traffic", value: ctx.scale },
      { label: "Requests", value: traffic.requests },
      { label: "Storage", value: traffic.storage },
      { label: "Database", value: traffic.db },
      { label: "Data transfer", value: traffic.transfer },
      { label: "Compute", value: traffic.instances },
      { label: "Pattern", value: ctx.pattern },
    ],
    recommendations: recommendations.slice(0, 3),
    currency: "USD",
  };
}

export const formatUsd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
