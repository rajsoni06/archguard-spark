import { classifyBoundaryPlacement } from "./boundaryPolicy";
import { findService, type Capability, type CloudId } from "./catalog";
import type { ConnectionType } from "./connectionSemantics";

export interface ProjectContext {
  name: string;
  cloud: CloudId;
  pattern: string;
  scale: string;
  industry: string;
  priority: string;
  // System Requirements (new)
  traffic: string;       // "1K RPS" | "10K RPS" | "100K RPS" | "1M+ RPS"
  availability: string;  // "99%" | "99.9%" | "99.99%" | "99.999%"
  consistency: string;   // "Strong" | "Eventual" | "Configurable"
  latency: string;       // "<50ms" | "<100ms" | "<500ms" | "<1sec"
}


export interface GraphNode {
  id: string;
  serviceId: string;
  label: string;
  caps: Capability[];
  cloud?: CloudId;
  boundary?: string | undefined;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: ConnectionType;
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

const trafficRank = (traffic: string) =>
  ["1K RPS", "10K RPS", "100K RPS", "1M+ RPS"].indexOf(traffic ?? "1K RPS");

const availabilityRank = (availability: string) =>
  ["99%", "99.9%", "99.99%", "99.999%"].indexOf(availability ?? "99%");

const has = (g: ArchGraph, cap: Capability) => g.nodes.some((n) => n.caps.includes(cap));
const countCap = (g: ArchGraph, cap: Capability) =>
  g.nodes.filter((n) => n.caps.includes(cap)).length;
const always = () => true;

const hasDirectedPath = (g: ArchGraph, from: Capability[], to: Capability[]) => {
  const sources = new Set(g.nodes.filter((n) => from.some((cap) => n.caps.includes(cap))).map((n) => n.id));
  const targets = new Set(g.nodes.filter((n) => to.some((cap) => n.caps.includes(cap))).map((n) => n.id));
  return g.edges.some((edge) => sources.has(edge.source) && targets.has(edge.target));
};

const hasTwoHopPath = (g: ArchGraph, first: Capability[], middle: Capability[], last: Capability[]) => {
  const middleIds = new Set(g.nodes.filter((n) => middle.some((cap) => n.caps.includes(cap))).map((n) => n.id));
  const firstIds = new Set(g.nodes.filter((n) => first.some((cap) => n.caps.includes(cap))).map((n) => n.id));
  const lastIds = new Set(g.nodes.filter((n) => last.some((cap) => n.caps.includes(cap))).map((n) => n.id));
  return g.edges.some((a) => firstIds.has(a.source) && middleIds.has(a.target)) &&
    g.edges.some((b) => middleIds.has(b.source) && lastIds.has(b.target));
};

const allServicesConnected = (g: ArchGraph) => {
  if (g.nodes.length < 2) return true;
  const adjacency = new Map(g.nodes.map((node) => [node.id, new Set<string>()]));
  g.edges.forEach((edge) => {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  });
  const start = g.nodes[0]!.id;
  const visited = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const current = queue.shift()!;
    adjacency.get(current)?.forEach((id) => {
      if (!visited.has(id)) {
        visited.add(id);
        queue.push(id);
      }
    });
  }
  return visited.size === g.nodes.length;
};

const hasCrossCloudPath = (g: ArchGraph) => g.edges.some((edge) => {
  const source = g.nodes.find((node) => node.id === edge.source);
  const target = g.nodes.find((node) => node.id === edge.target);
  return source?.cloud && target?.cloud && source.cloud !== target.cloud;
});


const inPrivate = (n: GraphNode) =>
  n.boundary === "private-subnet" || n.boundary === "database-layer";

const boundaryPlacementForNode = (n: GraphNode, ctx: ProjectContext) => {
  if (!n.boundary) return "Allowed" as const;
  const svc = findService(n.cloud || ctx.cloud, n.serviceId);
  if (!svc) return "Allowed" as const;
  return classifyBoundaryPlacement(n.boundary as any, { id: svc.id, category: svc.category, caps: svc.caps }, ctx.cloud);
};

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
    id: "sec-insecure-transport",
    category: "Security",
    severity: "medium",
    strength: "Sensitive communication uses an encrypted transport",
    issue: "HTTP is used on a potentially sensitive connection",
    recommendation: "Use HTTPS or another encrypted transport for client, identity, database, and other sensitive service communication.",
    learn: "encryption",
    applies: always,
    satisfied: (g) => !g.edges.some((edge) => {
      if (edge.type !== "HTTP") return false;
      const source = g.nodes.find((node) => node.id === edge.source);
      const target = g.nodes.find((node) => node.id === edge.target);
      return source?.caps.includes("client") || target?.caps.includes("database") || target?.caps.includes("auth");
    }),
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
  {
    id: "pattern-entry-compute-data",
    category: "Scalability",
    severity: "medium",
    strength: "Entry traffic is routed through compute before reaching cache or data",
    issue: "Entry, compute, and data tiers are not connected as a request path",
    recommendation: "Connect API Gateway or a load balancer to compute, then connect compute to cache and/or a database.",
    learn: "system-design-basics",
    applies: always,
    satisfied: (g) => {
      const hasEntry = has(g, "api-gateway") || has(g, "load-balancer");
      const hasRuntime = has(g, "compute") || has(g, "container") || has(g, "serverless");
      const hasData = has(g, "database") || has(g, "cache");
      return !(hasEntry && hasRuntime && hasData) ||
        hasTwoHopPath(g, ["api-gateway", "load-balancer"], ["compute", "container", "serverless"], ["database", "cache"]);
    },
  },
  {
    id: "pattern-async-worker-data",
    category: "Reliability",
    severity: "medium",
    strength: "Asynchronous work is delivered to a worker before persistence",
    issue: "Queue/event traffic is not connected to a worker and durable data store",
    recommendation: "Connect Queue, Pub/Sub, Event Bus, or streaming to a worker, then connect the worker to a database or object store.",
    learn: "message-queues",
    applies: always,
    satisfied: (g) => {
      const hasAsync = has(g, "queue") || has(g, "pubsub") || has(g, "event-bus") || has(g, "streaming");
      const hasWorker = has(g, "compute") || has(g, "container") || has(g, "serverless");
      const hasStore = has(g, "database") || has(g, "object-storage");
      return !(hasAsync && hasWorker && hasStore) ||
        hasTwoHopPath(g, ["queue", "pubsub", "event-bus", "streaming"], ["compute", "container", "serverless"], ["database", "object-storage"]);
    },
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
    id: "topology-connected",
    category: "Reliability",
    severity: "high",
    strength: "Every service participates in the application topology",
    issue: "One or more services are disconnected from the architecture",
    recommendation: "Connect every runtime, storage, analytics, and integration service to a purposeful upstream and downstream flow, or remove it from the design.",
    learn: "system-design-basics",
    applies: always,
    satisfied: allServicesConnected,
  },
  {
    id: "topology-cross-cloud",
    category: "Reliability",
    severity: "high",
    strength: "Cross-cloud traffic uses an explicit integration path",
    issue: "Services from different clouds are connected without a declared integration boundary",
    recommendation: "Place each cloud in its own boundary and connect them through a VPN, interconnect, private endpoint, or an explicit HTTPS API integration.",
    learn: "multi-cloud-architecture",
    applies: always,
    satisfied: (g) => {
      const clouds = new Set(g.nodes.map((node) => node.cloud).filter(Boolean));
      return clouds.size < 2 || (hasCrossCloudPath(g) && has(g, "network"));
    },
  },
  {
    id: "topology-storage-ai",
    category: "Reliability",
    severity: "medium",
    strength: "AI services are reached through an application or data-access layer",
    issue: "Block storage is connected directly to an AI or serverless service",
    recommendation: "Attach block storage to compute or a container workload, and use object storage for serverless file access. Call AI services through an application layer rather than from a disk.",
    learn: "ai-architecture",
    applies: always,
    satisfied: (g) => !g.edges.some((edge) => {
      const source = g.nodes.find((node) => node.id === edge.source);
      const target = g.nodes.find((node) => node.id === edge.target);
      if (!source || !target) return false;
      const sourceStorage = source.caps.includes("block-storage");
      const targetStorage = target.caps.includes("block-storage");
      const sourceInvalid = source.caps.includes("ai") || source.caps.includes("serverless") && !source.caps.includes("container");
      const targetInvalid = target.caps.includes("ai") || target.caps.includes("serverless") && !target.caps.includes("container");
      return sourceStorage && targetInvalid || targetStorage && sourceInvalid;
    }),
  },
  {
    id: "topology-analytics-api",
    category: "Performance",
    severity: "medium",
    strength: "Analytics processing is decoupled from synchronous API traffic",
    issue: "An API gateway connects directly to an analytics processing service",
    recommendation: "Route the request to an application service, then publish work to a queue or data pipeline before HDInsight or another analytics engine.",
    learn: "message-queues",
    applies: always,
    satisfied: (g) => !g.edges.some((edge) => {
      const source = g.nodes.find((node) => node.id === edge.source);
      const target = g.nodes.find((node) => node.id === edge.target);
      return Boolean(source?.caps.includes("api-gateway") && target?.caps.includes("analytics"));
    }),
  },
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
    id: "data-pipeline",
    category: "Performance",
    severity: "low",
    strength: "Data pipeline connects ingestion, transformation, and analytical storage",
    issue: "Analytics components are present without a recognizable data pipeline",
    recommendation: "Connect streaming or source storage to ETL/stream processing, then to a data lake or warehouse.",
    learn: "data-pipelines",
    applies: always,
    satisfied: (g) => {
      const pipeline = has(g, "streaming") || has(g, "etl") || has(g, "data-lake") || has(g, "warehouse");
      if (!pipeline) return true;
      const processing = has(g, "etl") || has(g, "streaming");
      const destination = has(g, "data-lake") || has(g, "warehouse");
      return !(processing && destination) || hasDirectedPath(g, ["streaming", "etl", "object-storage"], ["data-lake", "warehouse", "database"]);
    },
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
  {
    id: "boundaries-cloud-fit",
    category: "Security",
    severity: "medium",
    strength: "Services sit in boundaries that match their cloud-native behavior",
    issue: "Some services are nested in boundaries where they normally stay external",
    recommendation:
      "Move global edge, identity, CI/CD, and telemetry services outside the physical boundary and connect them logically instead. Keep only services that naturally belong inside the network container.",
    applies: always,
    satisfied: (g, ctx) => !g.nodes.some((n) => boundaryPlacementForNode(n, ctx) === "External"),
  },
  {
    id: "cicd-runtime-separation",
    category: "Reliability",
    severity: "medium",
    strength: "CI/CD remains separate from runtime traffic",
    issue: "A DevOps service appears on the user request path",
    recommendation:
      "Keep GitHub Actions, Azure DevOps, and similar tools outside the runtime chain. Use them to deploy into App Service, VM, or Databricks targets instead of routing user traffic through them.",
    applies: always,
    satisfied: (g, ctx) => {
      const devopsTargets = new Set(
        g.nodes
          .filter((n) => {
            const svc = findService(ctx.cloud, n.serviceId);
            return svc?.category === "DevOps";
          })
          .map((n) => n.id),
      );
      if (devopsTargets.size === 0) return true;

      const entryCaps: Capability[] = ["client", "dns", "cdn", "waf", "load-balancer", "api-gateway"];
      return !g.edges.some((e) => {
        const source = g.nodes.find((n) => n.id === e.source);
        const target = g.nodes.find((n) => n.id === e.target);
        if (!source || !target) return false;
        return devopsTargets.has(target.id) && source.caps.some((cap) => entryCaps.includes(cap));
      });
    },
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
  // ---------------- Architecture Trade-offs (NEW) ----------------
  {
    id: "tradeoff-overengineered-queue",
    category: "Cost Optimization",
    severity: "medium",
    strength: "Messaging complexity matches workload scale",
    issue: "Streaming / event-bus technology may be over-engineered for this scale",
    recommendation:
      "At 1K–10K users a simple job queue is cheaper and simpler than a full streaming platform. Reserve Kafka / Kinesis for 100K+ RPS workloads with strict ordering or replay needs.",
    learn: "message-queues",
    applies: (c) =>
      scaleRank(c.scale) <= 1 &&
      ["Microservices", "Monolithic", "Layered (N-Tier)"].includes(c.pattern),
    satisfied: (g) => !has(g, "streaming"),
  },
  // ---------------- SPOF Detection (NEW) ----------------
  {
    id: "spof-single-backend",
    category: "Availability",
    severity: "critical",
    strength: "Multiple compute units prevent a backend Single Point of Failure",
    issue: "Single backend instance — SPOF detected for your availability target",
    recommendation:
      "Your availability target requires at least two backend instances behind a load balancer in separate AZs. A single instance means any restart or hardware failure causes full downtime.",
    learn: "high-availability",
    applies: (c) => availabilityRank(c.availability ?? "99%") >= 2,
    satisfied: (g) =>
      countCap(g, "compute") >= 2 || has(g, "autoscaling") || has(g, "serverless"),
  },
  {
    id: "spof-single-db-availability",
    category: "Availability",
    severity: "critical",
    strength: "Database replication matches the availability target",
    issue: "Single database instance with a high availability target — critical SPOF",
    recommendation:
      "Your availability target requires database redundancy. Enable Multi-AZ or a managed HA engine so a single node failure does not take down the data tier.",
    learn: "replication",
    applies: (c) => availabilityRank(c.availability ?? "99%") >= 2,
    satisfied: (g) =>
      countCap(g, "managed-database") >= 1 || countCap(g, "database") >= 2,
  },
  // ---------------- Async / DLQ Patterns (NEW) ----------------
  {
    id: "async-dlq-missing",
    category: "Reliability",
    severity: "high",
    strength: "Dead-letter queue pattern handles permanently-failing messages",
    issue: "Async queue detected without a Dead-Letter Queue (DLQ) pattern",
    recommendation:
      "Without a DLQ, poison messages that always fail will be retried indefinitely, consuming worker capacity. Add a separate DLQ destination to isolate and inspect failed messages.",
    learn: "message-queues",
    applies: (c) =>
      ["Event-Driven", "Microservices", "CQRS", "Distributed System"].includes(c.pattern),
    satisfied: (g) => {
      const hasQueue = has(g, "queue") || has(g, "pubsub");
      if (!hasQueue) return true;
      return countCap(g, "queue") >= 2;
    },
  },
  // ---------------- Rate Limiting (NEW) ----------------
  {
    id: "rate-limiting-missing",
    category: "Security",
    severity: "high",
    strength: "Rate limiting protects the API boundary from abuse and overload",
    issue: "No rate-limiting at the API boundary for a high-traffic workload",
    recommendation:
      "At 100K+ RPS, without rate limiting a single mis-configured client can exhaust your compute tier. Enforce throttling at the API Gateway or WAF layer.",
    learn: "owasp",
    applies: (c) => trafficRank(c.traffic ?? "1K RPS") >= 2,
    satisfied: (g) => has(g, "api-gateway") || has(g, "waf"),
  },
  // ---------------- Capacity / Latency (NEW) ----------------
  {
    id: "capacity-bottleneck",
    category: "Scalability",
    severity: "high",
    strength: "Auto scaling ensures the architecture can sustain peak traffic",
    issue: "High traffic target without auto scaling — capacity bottleneck likely",
    recommendation:
      "At 1M+ RPS a fixed instance count becomes the bottleneck before peak. Enable auto scaling so capacity is added automatically under load.",
    learn: "horizontal-scaling",
    applies: (c) => trafficRank(c.traffic ?? "1K RPS") >= 3,
    satisfied: (g) => has(g, "autoscaling") || has(g, "serverless"),
  },
  {
    id: "latency-cdn-missing",
    category: "Performance",
    severity: "high",
    strength: "CDN at the edge satisfies the low-latency requirement",
    issue: "Low-latency target without a CDN — global users will see high origin latency",
    recommendation:
      "For a <50ms or <100ms latency target, serve cacheable content from a CDN edge. Round-trip to an origin datacenter typically adds 50–200ms for distant users.",
    learn: "cdn",
    applies: (c) =>
      (c.latency ?? "<500ms") === "<50ms" || (c.latency ?? "<500ms") === "<100ms",
    satisfied: (g) => has(g, "cdn"),
  },
  {
    id: "consistency-cache-required",
    category: "Performance",
    severity: "medium",
    strength: "Cache layer supports the eventual consistency workload",
    issue: "Eventual consistency selected without a cache layer — reads always hit the database",
    recommendation:
      "Eventual consistency architectures benefit most from a cache. Reads can be served from cache while writes propagate to replicas, reducing latency and database load.",
    learn: "caching",
    applies: (c) => (c.consistency ?? "Strong") === "Eventual" && scaleRank(c.scale) >= 1,
    satisfied: (g) => has(g, "cache"),
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
  serviceNames: string[];
  connections: GraphEdge[];
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
      serviceNames: [],
      connections: [],
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
    serviceNames: graph.nodes.map((node) => node.label),
    connections: graph.edges,
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
  const services = result.serviceNames.length > 7
    ? `${result.serviceNames.slice(0, 7).join(", ")} and ${result.serviceNames.length - 7} more`
    : result.serviceNames.join(", ");
  const requirements = `${ctx.traffic} traffic, ${ctx.availability} availability, ${ctx.latency} latency, and ${ctx.consistency.toLowerCase()} consistency`;
  const connectionTypes = [...new Set(result.connections.map((connection) => connection.type))].join(", ");
  const topIssues = result.issues.slice(0, 2).map((i) => i.rule.issue.toLowerCase());
  const issueSummary = topIssues.length === 0
    ? "no major rule violations"
    : topIssues.length === 1
      ? topIssues[0]
      : `${topIssues[0]} and ${topIssues[1]}`;

  return [
    `I reviewed your ${ctx.cloud.toUpperCase()} ${ctx.pattern.toLowerCase()} canvas for a ${ctx.industry.toLowerCase()} workload at ${ctx.scale}. It contains ${result.nodeCount} components (${services}) connected by ${result.edgeCount} relationship${result.edgeCount === 1 ? "" : "s"}${connectionTypes ? ` using ${connectionTypes}` : ""}, with requirements for ${requirements}.`,
    `The architecture scores ${result.overall}/100 (${result.maturity}); ${worst?.category ?? "Security"} is the weakest area at ${worst?.score ?? 0}/100, mainly because of ${issueSummary}. ${result.issues[0] ? `My highest-impact recommendation is to ${result.issues[0].rule.recommendation.charAt(0).toLowerCase()}${result.issues[0].rule.recommendation.slice(1)}` : "The design has no major rule violations, so focus next on cost tuning and operational readiness."}`,
    result.issues[0]
      ? `My highest-impact recommendation is to ${result.issues[0].rule.recommendation.charAt(0).toLowerCase()}${result.issues[0].rule.recommendation.slice(1)}`
      : `The architecture satisfies every rule that applies to this context — focus next on cost tuning and operational runbooks.`,
  ].slice(0, 2).join("\n\n");
}

export function getArchitectureRoadmap(result: AnalysisResult, ctx: ProjectContext): string[] {
  const steps = result.issues.slice(0, 4).map((issue) => issue.rule.recommendation);
  const followUps = [
    `Validate the ${ctx.availability} availability target with failure testing and recovery runbooks.`,
    `Review ${ctx.cloud.toUpperCase()} costs, quotas, and scaling behavior under ${ctx.traffic} traffic.`,
    `Re-run the review after each change and confirm the ${ctx.latency} latency target with production-like load tests.`,
  ];
  for (const followUp of followUps) {
    if (steps.length >= 4) break;
    steps.push(followUp);
  }
  return steps;
}
