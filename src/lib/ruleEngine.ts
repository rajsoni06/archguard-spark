import type { Capability, CloudId } from "./catalog";

export interface ProjectContext {
  name: string;
  cloud: CloudId;
  pattern: string;
  scale: string;
  industry: string;
  priority: string;
}

export interface GraphNode {
  id: string;
  serviceId: string;
  label: string;
  caps: Capability[];
  boundary?: string | undefined;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface ArchGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type RuleCategory =
  | "Security"
  | "Scalability"
  | "Availability"
  | "Reliability"
  | "Performance"
  | "Cost Optimization"
  | "Compliance"
  | "Observability";

export const CATEGORIES: RuleCategory[] = [
  "Security",
  "Scalability",
  "Availability",
  "Reliability",
  "Performance",
  "Cost Optimization",
  "Compliance",
  "Observability",
];

export type Severity = "critical" | "high" | "medium" | "low";

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 5,
  high: 3,
  medium: 2,
  low: 1,
};

export interface Rule {
  id: string;
  category: RuleCategory;
  severity: Severity;
  /** Shown when the rule passes. */
  strength: string;
  /** Shown when the rule fails. */
  issue: string;
  recommendation: string;
  learn?: string;
  applies: (ctx: ProjectContext) => boolean;
  satisfied: (g: ArchGraph, ctx: ProjectContext) => boolean;
}

const scaleRank = (scale: string) =>
  ["1K Users", "10K Users", "100K Users", "1M+ Users", "10M+ Users"].indexOf(scale);

const has = (g: ArchGraph, cap: Capability) => g.nodes.some((n) => n.caps.includes(cap));
const countCap = (g: ArchGraph, cap: Capability) =>
  g.nodes.filter((n) => n.caps.includes(cap)).length;
const always = () => true;

const inPrivate = (n: GraphNode) =>
  n.boundary === "private-subnet" || n.boundary === "database-layer";

export const RULES: Rule[] = [
  // ---------------- Security ----------------
  {
    id: "sec-waf",
    category: "Security",
    severity: "high",
    strength: "WAF protects the application entry point",
    issue: "Missing WAF at the application entry point",
    recommendation: "Add a WAF in front of your CDN or load balancer to filter OWASP Top 10 traffic.",
    learn: "owasp",
    applies: (c) => scaleRank(c.scale) >= 2 || ["Banking", "E-Commerce", "Healthcare"].includes(c.industry),
    satisfied: (g) => has(g, "waf"),
  },
  {
    id: "sec-auth",
    category: "Security",
    severity: "critical",
    strength: "Authentication / identity service configured",
    issue: "No authentication or identity provider in the architecture",
    recommendation: "Add a managed identity service and enforce authentication at the gateway.",
    learn: "authentication",
    applies: always,
    satisfied: (g) => has(g, "auth"),
  },
  {
    id: "sec-private-db",
    category: "Security",
    severity: "critical",
    strength: "Databases are placed in a private network boundary",
    issue: "A database sits outside a private subnet / database layer",
    recommendation: "Move every data store into a private subnet and expose it only to the service tier.",
    learn: "zero-trust",
    applies: always,
    satisfied: (g) => {
      const dbs = g.nodes.filter((n) => n.caps.includes("database"));
      return dbs.length > 0 && dbs.every(inPrivate);
    },
  },
  {
    id: "sec-secrets",
    category: "Security",
    severity: "high",
    strength: "Secrets are stored in a managed secrets service",
    issue: "No secrets management service detected",
    recommendation: "Store credentials and API keys in a managed secrets vault instead of environment files.",
    learn: "secrets-management",
    applies: (c) => ["Banking", "Healthcare", "Government", "E-Commerce"].includes(c.industry) || scaleRank(c.scale) >= 3,
    satisfied: (g) => has(g, "secrets"),
  },
  {
    id: "sec-encryption",
    category: "Security",
    severity: "medium",
    strength: "Key management / encryption service present",
    issue: "No key management service for encryption at rest",
    recommendation: "Add a KMS-style service and enable encryption at rest for storage and databases.",
    learn: "encryption",
    applies: always,
    satisfied: (g) => has(g, "encryption"),
  },
  {
    id: "sec-public-exposure",
    category: "Security",
    severity: "critical",
    strength: "No sensitive service is directly exposed to clients",
    issue: "A client connects directly to a database or internal service",
    recommendation: "Route all client traffic through CDN → WAF → load balancer → API gateway before reaching services.",
    learn: "zero-trust",
    applies: always,
    satisfied: (g) => {
      const clients = new Set(g.nodes.filter((n) => n.caps.includes("client")).map((n) => n.id));
      const sensitive = new Set(
        g.nodes.filter((n) => n.caps.includes("database") || n.caps.includes("cache")).map((n) => n.id),
      );
      return !g.edges.some((e) => clients.has(e.source) && sensitive.has(e.target));
    },
  },
  // ---------------- Scalability ----------------
  {
    id: "scale-lb",
    category: "Scalability",
    severity: "critical",
    strength: "Load balancing configured",
    issue: "No load balancer in front of the compute tier",
    recommendation: "Place a load balancer in front of your services so traffic spreads across instances.",
    learn: "load-balancing",
    applies: (c) => scaleRank(c.scale) >= 1 && c.pattern !== "Serverless",
    satisfied: (g) => has(g, "load-balancer"),
  },
  {
    id: "scale-apigw",
    category: "Scalability",
    severity: "high",
    strength: "API Gateway centralises routing, authn and rate limiting",
    issue: "Microservices at scale without an API Gateway",
    recommendation: "Introduce an API Gateway for routing, throttling and centralised authentication.",
    learn: "microservices",
    applies: (c) =>
      ["Microservices", "Serverless", "Event-Driven"].includes(c.pattern) && scaleRank(c.scale) >= 2,
    satisfied: (g) => has(g, "api-gateway"),
  },
  {
    id: "scale-autoscaling",
    category: "Scalability",
    severity: "high",
    strength: "Auto scaling configured for the compute tier",
    issue: "No auto scaling — capacity cannot follow demand",
    recommendation: "Enable auto scaling groups or a serverless compute tier to absorb traffic spikes.",
    learn: "horizontal-scaling",
    applies: (c) => scaleRank(c.scale) >= 2,
    satisfied: (g) => has(g, "autoscaling") || has(g, "serverless"),
  },
  {
    id: "scale-stateless",
    category: "Scalability",
    severity: "medium",
    strength: "Multiple compute units support horizontal scaling",
    issue: "Single compute unit — the system scales vertically only",
    recommendation: "Run at least two service instances so the tier can scale out horizontally.",
    learn: "horizontal-scaling",
    applies: (c) => scaleRank(c.scale) >= 2,
    satisfied: (g) => countCap(g, "compute") >= 2 || has(g, "container"),
  },
  // ---------------- Availability ----------------
  {
    id: "avail-multi-az",
    category: "Availability",
    severity: "high",
    strength: "Multi-AZ deployment detected",
    issue: "Architecture is deployed inside a single availability zone",
    recommendation: "Spread compute and data across at least two availability zones.",
    learn: "high-availability",
    applies: (c) => scaleRank(c.scale) >= 2,
    satisfied: (g) => new Set(g.nodes.map((n) => n.boundary).filter((b) => b === "az")).size > 0 || has(g, "managed-database"),
  },
  {
    id: "avail-db-replication",
    category: "Availability",
    severity: "critical",
    strength: "Database replication / managed HA data tier",
    issue: "Database has no replication — single point of failure",
    recommendation: "Enable a read replica or multi-AZ deployment for the primary data store.",
    learn: "replication",
    applies: always,
    satisfied: (g) => countCap(g, "database") >= 2 || countCap(g, "managed-database") >= 1 && countCap(g, "database") > 1,
  },
  {
    id: "avail-dr",
    category: "Availability",
    severity: "high",
    strength: "Backup / archive tier supports disaster recovery",
    issue: "No disaster recovery or backup strategy",
    recommendation: "Add an archive/backup destination and document RTO and RPO targets.",
    learn: "disaster-recovery",
    applies: (c) => scaleRank(c.scale) >= 2 || ["Banking", "Healthcare"].includes(c.industry),
    satisfied: (g) => has(g, "archive") || has(g, "object-storage"),
  },
  // ---------------- Reliability ----------------
  {
    id: "rel-async",
    category: "Reliability",
    severity: "medium",
    strength: "Asynchronous messaging decouples services",
    issue: "All communication is synchronous — failures cascade",
    recommendation: "Introduce a queue or event bus for non-critical work to isolate failures.",
    learn: "message-queues",
    applies: (c) => ["Microservices", "Event-Driven", "Distributed System", "CQRS"].includes(c.pattern),
    satisfied: (g) => has(g, "queue") || has(g, "pubsub") || has(g, "streaming"),
  },
  {
    id: "rel-health",
    category: "Reliability",
    severity: "medium",
    strength: "Load balancer provides health checking and failover",
    issue: "No health checking layer for the service tier",
    recommendation: "Use load balancer health checks plus retries and circuit breakers between services.",
    learn: "circuit-breaker",
    applies: always,
    satisfied: (g) => has(g, "load-balancer") || has(g, "container"),
  },
  {
    id: "rel-storage-durable",
    category: "Reliability",
    severity: "low",
    strength: "Durable object storage for assets and backups",
    issue: "No durable object storage in the design",
    recommendation: "Store user uploads, exports and backups in object storage rather than on instances.",
    learn: "fault-tolerance",
    applies: always,
    satisfied: (g) => has(g, "object-storage"),
  },
  // ---------------- Performance ----------------
  {
    id: "perf-cache",
    category: "Performance",
    severity: "high",
    strength: "Caching layer detected",
    issue: "No caching layer — every read hits the database",
    recommendation: "Add a distributed cache in front of hot read paths to cut latency and database load.",
    learn: "caching",
    applies: (c) => scaleRank(c.scale) >= 1,
    satisfied: (g) => has(g, "cache"),
  },
  {
    id: "perf-cdn",
    category: "Performance",
    severity: "medium",
    strength: "CDN serves static content close to users",
    issue: "No CDN for static assets",
    recommendation: "Serve static assets and cached responses from a CDN edge.",
    learn: "cdn",
    applies: (c) => scaleRank(c.scale) >= 1,
    satisfied: (g) => has(g, "cdn"),
  },
  {
    id: "perf-dns",
    category: "Performance",
    severity: "low",
    strength: "Managed DNS handles routing and failover",
    issue: "No managed DNS entry point",
    recommendation: "Front the system with managed DNS for latency-based or failover routing.",
    learn: "load-balancing",
    applies: (c) => scaleRank(c.scale) >= 2,
    satisfied: (g) => has(g, "dns"),
  },
  // ---------------- Cost ----------------
  {
    id: "cost-rightsizing",
    category: "Cost Optimization",
    severity: "medium",
    strength: "Elastic capacity avoids over-provisioning",
    issue: "Fixed capacity with no elasticity increases idle spend",
    recommendation: "Use auto scaling or serverless compute so you pay for the traffic you actually receive.",
    learn: "right-sizing",
    applies: always,
    satisfied: (g) => has(g, "autoscaling") || has(g, "serverless"),
  },
  {
    id: "cost-storage-tier",
    category: "Cost Optimization",
    severity: "low",
    strength: "Archive tier used for cold data",
    issue: "No archive/cold storage tier for infrequently accessed data",
    recommendation: "Move cold data to an archive tier with lifecycle rules.",
    learn: "storage-optimization",
    applies: (c) => scaleRank(c.scale) >= 2,
    satisfied: (g) => has(g, "archive"),
  },
  {
    id: "cost-duplication",
    category: "Cost Optimization",
    severity: "low",
    strength: "No duplicated overlapping services",
    issue: "Multiple overlapping services of the same type inflate cost",
    recommendation: "Consolidate duplicate caches or gateways unless they serve distinct workloads.",
    applies: always,
    satisfied: (g) => countCap(g, "api-gateway") <= 2 && countCap(g, "cache") <= 2,
  },
  // ---------------- Compliance ----------------
  {
    id: "comp-encryption",
    category: "Compliance",
    severity: "high",
    strength: "Encryption controls satisfy data-protection requirements",
    issue: "Encryption controls missing for regulated data",
    recommendation: "Enable encryption at rest and in transit; document key rotation (PCI DSS, ISO 27001).",
    learn: "encryption",
    applies: (c) => ["Banking", "Healthcare", "Government", "E-Commerce"].includes(c.industry),
    satisfied: (g) => has(g, "encryption"),
  },
  {
    id: "comp-audit",
    category: "Compliance",
    severity: "medium",
    strength: "Centralised logging supports audit requirements",
    issue: "No centralised logging for audit trails (SOC 2)",
    recommendation: "Ship application and infrastructure logs to a central, retained log store.",
    learn: "observability",
    applies: always,
    satisfied: (g) => has(g, "monitoring"),
  },
  {
    id: "comp-data-residency",
    category: "Compliance",
    severity: "medium",
    strength: "Region boundary makes data residency explicit",
    issue: "No region boundary — data residency is undefined (GDPR)",
    recommendation: "Wrap the architecture in an explicit region boundary and pin data stores to it.",
    applies: (c) => ["Banking", "Healthcare", "Government"].includes(c.industry),
    satisfied: (g) => g.nodes.some((n) => n.boundary === "region"),
  },
  // ---------------- Observability ----------------
  {
    id: "obs-monitoring",
    category: "Observability",
    severity: "high",
    strength: "Monitoring and metrics configured",
    issue: "No monitoring service — incidents will be detected by users first",
    recommendation: "Add metrics, dashboards and alerting for every tier.",
    learn: "observability",
    applies: always,
    satisfied: (g) => has(g, "monitoring"),
  },
  {
    id: "obs-tracing",
    category: "Observability",
    severity: "medium",
    strength: "Distributed tracing configured",
    issue: "No distributed tracing across services",
    recommendation: "Instrument services with distributed tracing to debug cross-service latency.",
    learn: "observability",
    applies: (c) => ["Microservices", "Event-Driven", "Distributed System"].includes(c.pattern),
    satisfied: (g) => has(g, "tracing"),
  },
];

export interface RuleResult {
  rule: Rule;
  passed: boolean;
}

export interface CategoryScore {
  category: RuleCategory;
  /** null = not enough architecture to evaluate this category (shown as N/A). */
  score: number | null;
  passed: RuleResult[];
  failed: RuleResult[];
}

export type Maturity =
  | "Beginner"
  | "Startup Ready"
  | "Production Ready"
  | "Enterprise Ready"
  | "FAANG-Scale Architecture";

export interface AnalysisResult {
  overall: number;
  maturity: Maturity;
  categories: CategoryScore[];
  strengths: RuleResult[];
  issues: RuleResult[];
  evaluatedAt: string;
  nodeCount: number;
  edgeCount: number;
}

export function analyzeArchitecture(graph: ArchGraph, ctx: ProjectContext): AnalysisResult {
  // A canvas with nothing on it has not been designed yet — that is not the
  // same thing as an insecure design. Never emit violations for it.
  if (graph.nodes.length === 0) {
    return {
      overall: 0,
      maturity: "Beginner",
      categories: CATEGORIES.map((category) => ({
        category,
        score: null,
        passed: [],
        failed: [],
      })),
      strengths: [],
      issues: [],
      evaluatedAt: new Date().toISOString(),
      nodeCount: 0,
      edgeCount: graph.edges.length,
    };
  }

  const applicable = RULES.filter((r) => r.applies(ctx));
  const results: RuleResult[] = applicable.map((rule) => ({
    rule,
    passed: graph.nodes.length > 0 && rule.satisfied(graph, ctx),
  }));

  const empty = graph.nodes.length === 0;

  const categories: CategoryScore[] = CATEGORIES.map((category) => {
    const inCat = results.filter((r) => r.rule.category === category);
    const total = inCat.reduce((sum, r) => sum + SEVERITY_WEIGHT[r.rule.severity], 0);
    const earned = inCat
      .filter((r) => r.passed)
      .reduce((sum, r) => sum + SEVERITY_WEIGHT[r.rule.severity], 0);
    // An empty canvas — or a category with no applicable rules — cannot be
    // scored; it must never be reported as a perfect 100.
    const score = empty || total === 0 ? null : Math.round((earned / total) * 100);
    return {
      category,
      score,
      passed: inCat.filter((r) => r.passed),
      failed: inCat.filter((r) => !r.passed),
    };
  });

  const weightedTotal = results.reduce((sum, r) => sum + SEVERITY_WEIGHT[r.rule.severity], 0);
  const weightedEarned = results
    .filter((r) => r.passed)
    .reduce((sum, r) => sum + SEVERITY_WEIGHT[r.rule.severity], 0);
  const overall = weightedTotal === 0 ? 0 : Math.round((weightedEarned / weightedTotal) * 100);

  const maturity: Maturity =
    overall >= 92
      ? "FAANG-Scale Architecture"
      : overall >= 82
        ? "Enterprise Ready"
        : overall >= 68
          ? "Production Ready"
          : overall >= 45
            ? "Startup Ready"
            : "Beginner";

  return {
    overall,
    maturity,
    categories,
    strengths: results.filter((r) => r.passed),
    issues: results
      .filter((r) => !r.passed)
      .sort((a, b) => SEVERITY_WEIGHT[b.rule.severity] - SEVERITY_WEIGHT[a.rule.severity]),
    evaluatedAt: new Date().toISOString(),
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
  };
}

/**
 * Deterministic-result narration. The rule engine decides; this layer only
 * explains the findings in plain language.
 */
export function explainAnalysis(result: AnalysisResult, ctx: ProjectContext): string {
  if (result.nodeCount === 0) {
    return "The canvas is empty. Drag services from the component library and connect them to run a meaningful review.";
  }
  const scored = result.categories.filter((c) => c.score !== null);
  const worst = [...scored].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];
  const top = result.issues.slice(0, 3).map((i) => i.rule.issue.toLowerCase());
  const list =
    top.length === 0
      ? "no blocking issues remain"
      : top.length === 1
        ? top[0]
        : `${top.slice(0, -1).join(", ")} and ${top[top.length - 1]}`;

  return [
    `Your ${ctx.pattern.toLowerCase()} design on ${ctx.cloud.toUpperCase()} scores ${result.overall}/100 (${result.maturity}) for a ${ctx.industry.toLowerCase()} workload at ${ctx.scale}.`,
    `${worst?.category ?? "Security"} is the weakest dimension at ${worst?.score ?? 0}/100, driven mainly by ${list}.`,
    result.issues[0]
      ? `Highest-impact next step: ${result.issues[0].rule.recommendation}`
      : `The architecture satisfies every rule that applies to this context — focus next on cost tuning and operational runbooks.`,
    `Because the score comes from deterministic rules rather than a model, the same graph always produces the same result; this explanation only interprets it.`,
  ].join(" ");
}