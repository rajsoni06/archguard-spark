import { X, ThumbsUp, ThumbsDown, GitBranch, TriangleAlert, Lightbulb } from "lucide-react";
import type { ServiceDef } from "@/lib/catalog";
import type { ProjectContext } from "@/lib/ruleEngine";
import { cn } from "@/lib/utils";

interface TradeoffInfo {
  why: string;
  goodFor: string[];
  notIdealFor: string[];
  alternatives: string[];
  tradeoffs: string[];
  overengineeringWarning?: string | undefined;
}



function getTradeoffInfo(svc: ServiceDef, ctx: ProjectContext): TradeoffInfo {
  const scaleRank = ["1K Users", "10K Users", "100K Users", "1M+ Users", "10M+ Users"].indexOf(ctx.scale);

  // --- Compute ---
  if (svc.caps.includes("serverless")) {
    return {
      why: "Serverless functions execute on-demand with zero idle cost. The platform handles scaling, patching, and capacity automatically.",
      goodFor: ["Event-driven handlers", "Lightweight APIs", "Scheduled jobs", "Low-to-moderate traffic"],
      notIdealFor: ["Long-running workloads (>15 min)", "Heavy CPU/GPU tasks", "Low cold-start latency needs"],
      alternatives: ["Container service (ECS/Cloud Run)", "EC2 with auto scaling"],
      tradeoffs: ["Cold start adds 50–500ms latency", "Per-invocation pricing favors sporadic workloads", "Vendor lock-in at runtime layer"],
      overengineeringWarning: scaleRank > 3 ? "At 1M+ users, serverless cold-starts may impact p99 latency. Evaluate container-based compute for steady traffic." : undefined,
    };
  }

  if (svc.caps.includes("autoscaling")) {
    return {
      why: "Auto scaling groups add or remove instances based on demand metrics, ensuring you never pay for idle capacity or run out under load.",
      goodFor: ["Variable traffic workloads", "Cost efficiency", "Production compute tiers"],
      notIdealFor: ["Constant predictable traffic (use reserved capacity instead)", "Stateful workloads"],
      alternatives: ["Kubernetes HPA", "Serverless (if workload fits)"],
      tradeoffs: ["Scale-out takes 2–5 minutes — not instant", "Requires stateless application design"],
    };
  }

  if (svc.caps.includes("container") && !svc.caps.includes("serverless")) {
    const isKubernetes = svc.id.includes("eks") || svc.id.includes("aks") || svc.id.includes("gke") || svc.id.includes("k8s");
    return {
      why: isKubernetes
        ? "Kubernetes provides declarative workload management, auto healing, rolling deployments, and rich ecosystem tooling."
        : "Managed container services run containers without managing a cluster — simpler than Kubernetes for most workloads.",
      goodFor: isKubernetes
        ? ["Large microservice fleets", "Multi-team platform teams", "Complex scheduling needs"]
        : ["Containerized applications", "Microservices", "Teams without Kubernetes expertise"],
      notIdealFor: isKubernetes
        ? ["Small teams (<5 engineers)", "Simple 1–5 service architectures"]
        : ["Complex cluster-level customization"],
      alternatives: isKubernetes ? ["ECS Fargate / Cloud Run / Container Apps", "Auto-scaled VMs"] : ["Kubernetes (EKS/GKE/AKS)", "Serverless functions"],
      tradeoffs: isKubernetes
        ? ["High operational complexity", "Control-plane cost (~$150/mo)", "Steep learning curve"]
        : ["Less control than Kubernetes", "Some vendor lock-in"],
      overengineeringWarning: isKubernetes && scaleRank <= 1
        ? `Kubernetes at ${ctx.scale} adds significant operational overhead with little benefit. Consider a simpler managed container service.`
        : undefined,
    };
  }

  if (svc.caps.includes("compute")) {
    return {
      why: "Virtual machines give you full control over the OS, runtime, and configuration — the most flexible compute option.",
      goodFor: ["Legacy applications", "Custom OS requirements", "Lift-and-shift migrations", "GPU/FPGA workloads"],
      notIdealFor: ["Teams that want to avoid patching", "Highly variable traffic (prefer auto scaling or serverless)"],
      alternatives: ["Managed containers (ECS/Cloud Run)", "Serverless functions", "PaaS (App Engine/Elastic Beanstalk)"],
      tradeoffs: ["You own OS patching and security", "Fixed cost even when idle without auto scaling"],
    };
  }

  // --- Database ---
  if (svc.caps.includes("nosql")) {
    return {
      why: "NoSQL databases trade relational expressiveness for horizontal scalability, flexible schemas, and predictable low-latency access patterns.",
      goodFor: ["Key-value lookups", "Document storage", "Session/cart data", "High-scale read-heavy workloads"],
      notIdealFor: ["Complex multi-table joins", "ACID transactions across entities", "Ad-hoc reporting queries"],
      alternatives: ["PostgreSQL / MySQL for relational workloads", "NewSQL (Spanner, CockroachDB) for global ACID"],
      tradeoffs: ["Limited query flexibility", "Eventual consistency by default in many engines", "Schema migration is harder"],
      overengineeringWarning: ctx.consistency === "Strong"
        ? "You selected Strong consistency but chose a NoSQL database. Verify your engine supports strong reads (e.g., Cosmos DB with Session/Strong level)."
        : undefined,
    };
  }

  if (svc.caps.includes("managed-database") || svc.caps.includes("database")) {
    return {
      why: "Relational databases provide ACID guarantees, strong consistency, complex queries and joins — the right tool for transactional workloads.",
      goodFor: ["User accounts", "Orders and payments", "Inventory", "Structured relational data"],
      notIdealFor: ["Unstructured document data", "Horizontal write scaling beyond a single primary", "Time-series data at scale"],
      alternatives: ["DynamoDB / Firestore / Cosmos DB for key-value at scale", "Spanner / Aurora Global for global ACID"],
      tradeoffs: ["Vertical scaling limit for writes", "Schema migrations require downtime planning", "Cross-region replication adds complexity"],
    };
  }

  if (svc.caps.includes("cache")) {
    return {
      why: "In-memory caches serve frequently-read data in microseconds, dramatically reducing database load and latency.",
      goodFor: ["Session storage", "Hot read-through data", "Rate limiting counters", "Pub/Sub fanout"],
      notIdealFor: ["Primary data storage (it's volatile)", "Complex relational queries"],
      alternatives: ["CDN for static/edge caching", "Application-level in-process cache (simpler but not shared)"],
      tradeoffs: ["Data is lost on restart unless persistence is enabled", "Cache invalidation is notoriously hard to get right", "Adds another operational component"],
    };
  }

  // --- Networking ---
  if (svc.caps.includes("load-balancer")) {
    return {
      why: "Load balancers distribute traffic across healthy instances, removing single points of failure and enabling horizontal scaling.",
      goodFor: ["Any multi-instance compute tier", "Health checking", "TLS termination", "Blue/green deployments"],
      notIdealFor: ["Single-instance prototypes (adds cost without benefit)"],
      alternatives: ["API Gateway (adds routing, auth, throttling at L7)", "DNS-based load balancing for regional failover"],
      tradeoffs: ["Additional network hop adds ~1ms latency", "Cost for idle capacity"],
    };
  }

  if (svc.caps.includes("api-gateway")) {
    return {
      why: "API Gateways provide a single governed entry point: routing, authentication, rate limiting, request transformation and observability.",
      goodFor: ["Microservices entry point", "Enforcing auth/rate limiting centrally", "API versioning", "Request aggregation"],
      notIdealFor: ["Simple single-service backends (use LB instead)", "WebSocket-heavy workloads (prefer NLB)"],
      alternatives: ["Application Load Balancer (simpler, cheaper, no API-level features)", "Nginx/Envoy (self-managed)"],
      tradeoffs: ["Additional latency per request (~5–20ms)", "Cost at high RPS", "Vendor-specific configuration"],
      overengineeringWarning: scaleRank <= 1 && ctx.pattern === "Monolithic"
        ? `An API Gateway for a monolith at ${ctx.scale} may be unnecessary. A simple load balancer is cheaper and simpler.`
        : undefined,
    };
  }

  if (svc.caps.includes("cdn")) {
    return {
      why: "CDNs cache content at geographically distributed edge nodes, reducing origin latency and bandwidth cost for global users.",
      goodFor: ["Static assets (JS, CSS, images)", "Cacheable API responses", "Video streaming", "Global user bases"],
      notIdealFor: ["Highly personalized dynamic responses", "Real-time data that can't be cached"],
      alternatives: ["Regional deployment (for single-geography products)", "Edge compute for dynamic content"],
      tradeoffs: ["Cache invalidation delays (TTL-based)", "Configuration complexity for cache rules", "Additional cost for cache misses"],
    };
  }

  // --- Messaging ---
  if (svc.caps.includes("streaming")) {
    return {
      why: "Streaming platforms handle high-throughput ordered event streams with replay capability — ideal for analytics pipelines and event sourcing.",
      goodFor: ["Real-time analytics", "Event sourcing / CQRS", "Log aggregation", "High-throughput event pipelines"],
      notIdealFor: ["Simple task queues", "Low-volume async jobs", "Small teams without streaming expertise"],
      alternatives: ["SQS / Cloud Tasks / Service Bus (simpler queue)", "Pub/Sub for fan-out without ordering"],
      tradeoffs: ["High operational complexity", "Requires schema registry for production", "Per-partition throughput limits"],
      overengineeringWarning: scaleRank <= 1
        ? `A full streaming platform at ${ctx.scale} is over-engineered. A simple job queue (SQS, Cloud Tasks) is 90% cheaper and simpler.`
        : undefined,
    };
  }

  if (svc.caps.includes("queue") || svc.caps.includes("pubsub")) {
    return {
      why: "Message queues decouple producers from consumers, absorb traffic spikes, and enable independent scaling of async workers.",
      goodFor: ["Background job processing", "Email/notification delivery", "Workflow orchestration", "Decoupling microservices"],
      notIdealFor: ["Real-time synchronous request-response", "Ordered streaming at very high throughput"],
      alternatives: ["Kafka/Kinesis (if ordering and replay are critical)", "Direct HTTP (if coupling is acceptable)"],
      tradeoffs: ["Adds operational component to manage", "At-least-once delivery requires idempotent consumers", "Message visibility timeout tuning needed"],
    };
  }

  // --- Security ---
  if (svc.caps.includes("waf")) {
    return {
      why: "WAFs inspect HTTP/HTTPS traffic and block OWASP Top 10 attacks (SQLi, XSS, etc.) before they reach your application.",
      goodFor: ["Public-facing APIs", "E-commerce and banking", "GDPR/PCI compliance", "DDoS mitigation"],
      notIdealFor: ["Internal services with no public exposure"],
      alternatives: ["Application-level input validation (always needed alongside WAF)", "API Gateway throttling for rate abuse"],
      tradeoffs: ["False positives can block legitimate traffic", "Managed WAF rules need regular updates", "Additional latency (~5ms)"],
    };
  }

  if (svc.caps.includes("auth")) {
    return {
      why: "Managed identity services handle user registration, authentication, MFA, OAuth and token lifecycle — removing risky custom auth code.",
      goodFor: ["User-facing applications", "B2B federation", "Social login", "MFA enforcement"],
      notIdealFor: ["Service-to-service auth (use IAM roles / mTLS instead)"],
      alternatives: ["Custom auth with JWT (higher complexity, higher risk)", "Open source (Keycloak, Auth0 self-hosted)"],
      tradeoffs: ["Vendor lock-in for user identity", "Cost scales with MAU", "Limited customization in hosted models"],
    };
  }

  // --- Monitoring ---
  if (svc.caps.includes("monitoring") || svc.caps.includes("tracing")) {
    return {
      why: "Observability lets you detect, diagnose and resolve incidents before users notice — without it, you're flying blind.",
      goodFor: ["All production systems", "SLA/SLO management", "Incident response", "Performance optimization"],
      notIdealFor: ["Local development (overkill)"],
      alternatives: ["Open source (Prometheus + Grafana + Jaeger)", "DataDog, New Relic (SaaS)"],
      tradeoffs: ["Data volume cost at scale", "Configuration and alert tuning effort"],
    };
  }

  // --- Storage ---
  if (svc.caps.includes("object-storage")) {
    return {
      why: "Object storage provides infinitely scalable, durable, cheap storage for unstructured data — the industry standard for blobs, backups and static files.",
      goodFor: ["User uploads", "Backups and exports", "Static website hosting", "Data lake foundation"],
      notIdealFor: ["Low-latency random access (use block storage)", "Relational data"],
      alternatives: ["Block storage (EBS/Persistent Disk) for low-latency random I/O", "File storage (EFS) for shared filesystem"],
      tradeoffs: ["Eventual consistency for list operations (S3 is now strongly consistent for most ops)", "Access latency ~10–100ms"],
    };
  }

  // Default fallback
  return {
    why: `${svc.name} is a managed cloud service that handles ${svc.caps.join(", ")} capabilities.`,
    goodFor: ["Managed operation — no infrastructure to maintain", "Native cloud integration"],
    notIdealFor: ["Scenarios requiring custom configuration not supported by the managed service"],
    alternatives: ["Self-managed equivalent on EC2/VMs"],
    tradeoffs: ["Vendor lock-in", "Less control than self-managed"],
  };
}

interface Props {
  svc: ServiceDef;
  ctx: ProjectContext;
  onClose: () => void;
}

export function TradeoffCard({ svc, ctx, onClose }: Props) {
  const info = getTradeoffInfo(svc, ctx);
  const Icon = svc.icon;

  return (
    <div className="absolute right-2 top-14 z-40 w-80 rounded-2xl border border-border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <Icon className="size-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">{svc.name}</div>
            <div className="text-[10px] text-muted-foreground">{svc.category} · Decision Card</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto p-4 space-y-3.5">
        {/* Over-engineering warning */}
        {info.overengineeringWarning && (
          <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/8 p-3">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-yellow-600 dark:text-yellow-400" />
            <p className="text-[11px] leading-relaxed text-yellow-700 dark:text-yellow-400">
              <span className="font-semibold">Trade-off: </span>
              {info.overengineeringWarning}
            </p>
          </div>
        )}

        {/* Why */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="size-3" />
            Why use it?
          </div>
          <p className="text-[12px] leading-relaxed text-foreground">{info.why}</p>
        </div>

        {/* Good for */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <ThumbsUp className="size-3" />
            Good for
          </div>
          <ul className="space-y-1">
            {info.goodFor.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-[11px] text-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Not ideal for */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <ThumbsDown className="size-3" />
            Not ideal for
          </div>
          <ul className="space-y-1">
            {info.notIdealFor.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Alternatives */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <GitBranch className="size-3" />
            Alternatives
          </div>
          <div className="flex flex-wrap gap-1.5">
            {info.alternatives.map((alt) => (
              <span
                key={alt}
                className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {alt}
              </span>
            ))}
          </div>
        </div>

        {/* Trade-offs */}
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            ⚖ Trade-offs
          </div>
          <ul className="space-y-1">
            {info.tradeoffs.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange-400/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
