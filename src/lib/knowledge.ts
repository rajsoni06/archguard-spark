export interface Article {
  slug: string;
  title: string;
  summary: string;
  readMinutes: number;
  sections: { heading: string; body: string[] }[];
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  topics: string[];
  articles: Article[];
}

const a = (
  slug: string,
  title: string,
  summary: string,
  readMinutes: number,
  sections: { heading: string; body: string[] }[],
): Article => ({ slug, title, summary, readMinutes, sections });

export const KNOWLEDGE: KnowledgeCategory[] = [
  {
    id: "patterns",
    name: "System Design Patterns",
    description: "Structural choices that shape everything downstream.",
    topics: [
      "Microservices",
      "Monolith",
      "Event-Driven Architecture",
      "CQRS",
      "Clean Architecture",
      "Hexagonal Architecture",
      "Serverless",
      "Distributed Systems",
    ],
    articles: [
      a(
        "microservices",
        "Microservices & the API Gateway",
        "Why service decomposition needs a single, governed entry point.",
        6,
        [
          {
            heading: "What it is",
            body: [
              "Microservices split a system into independently deployable services that own their data and lifecycle.",
              "An API Gateway sits in front of them and gives clients one address instead of dozens.",
            ],
          },
          {
            heading: "Why it matters",
            body: [
              "The gateway centralises authentication, rate limiting, routing, request shaping and observability.",
              "Without it, every service re-implements auth and throttling — inconsistently.",
            ],
          },
          {
            heading: "When to use it",
            body: [
              "Use microservices when teams need independent deploy cadence or when parts of the system scale very differently.",
              "Below roughly 100K users a well-structured modular monolith is usually cheaper and faster to operate.",
            ],
          },
        ],
      ),
      a(
        "event-driven",
        "Event-Driven Architecture",
        "Decoupling producers from consumers using events.",
        5,
        [
          {
            heading: "Core idea",
            body: [
              "Producers emit facts about what happened; consumers subscribe and react on their own schedule.",
              "The broker absorbs bursts so a slow consumer never takes the producer down.",
            ],
          },
          {
            heading: "Trade-offs",
            body: [
              "You gain resilience and elasticity, and you pay with eventual consistency and harder debugging.",
              "Distributed tracing and a dead-letter queue are not optional in this style.",
            ],
          },
        ],
      ),
    ],
  },
  {
    id: "scalability",
    name: "Scalability",
    description: "Serving more traffic without redesigning the system.",
    topics: [
      "Horizontal Scaling",
      "Vertical Scaling",
      "Load Balancing",
      "Caching",
      "Sharding",
      "Partitioning",
      "Replication",
    ],
    articles: [
      a(
        "horizontal-scaling",
        "Horizontal Scaling & Auto Scaling",
        "Add instances instead of bigger instances.",
        5,
        [
          {
            heading: "What it is",
            body: [
              "Horizontal scaling adds more identical, stateless instances behind a load balancer.",
              "Auto scaling adds and removes those instances automatically based on demand signals.",
            ],
          },
          {
            heading: "Requirements",
            body: [
              "Instances must be stateless: sessions live in a cache, files live in object storage.",
              "Startup must be fast enough that scaling reacts before the queue backs up.",
            ],
          },
          {
            heading: "Why the rule engine flags it",
            body: [
              "Above 100K expected users a fixed instance count is both a availability risk and a cost problem.",
            ],
          },
        ],
      ),
      a(
        "load-balancing",
        "Load Balancing",
        "Distributing traffic and removing single points of failure.",
        4,
        [
          {
            heading: "What it does",
            body: [
              "A load balancer spreads requests across healthy instances and removes failed ones from rotation.",
              "It also terminates TLS and provides the health-check signal your platform reacts to.",
            ],
          },
          {
            heading: "Algorithms",
            body: [
              "Round robin is the default; least-connections suits long requests; consistent hashing suits sticky caches.",
            ],
          },
        ],
      ),
      a(
        "caching",
        "Caching",
        "Cut latency and protect the database from read storms.",
        5,
        [
          {
            heading: "Where caches live",
            body: [
              "Browser, CDN edge, application memory, and a shared distributed cache such as Redis.",
              "A distributed cache is the one that materially reduces database load in a multi-instance system.",
            ],
          },
          {
            heading: "Invalidation",
            body: [
              "Prefer TTL plus explicit invalidation on write. Cache-aside is the safest default pattern.",
              "Guard against stampedes with request coalescing or jittered TTLs.",
            ],
          },
        ],
      ),
      a(
        "replication",
        "Database Replication",
        "Why a single database instance is a single point of failure.",
        6,
        [
          {
            heading: "What replication is",
            body: [
              "Replication keeps one or more copies of your data on separate nodes, continuously synchronised from a primary.",
            ],
          },
          {
            heading: "Primary / replica topology",
            body: [
              "Writes go to the primary; replicas stream changes and serve reads.",
              "A multi-AZ standby sits in a second availability zone and is promoted on failure.",
            ],
          },
          {
            heading: "Read replicas",
            body: [
              "Read replicas absorb reporting and read-heavy traffic, but return slightly stale data.",
              "Route only read paths that tolerate replication lag.",
            ],
          },
          {
            heading: "Failover",
            body: [
              "Managed engines promote the standby automatically, typically in under a minute.",
              "Applications must reconnect and retry — test this, do not assume it.",
            ],
          },
          {
            heading: "Advantages / disadvantages",
            body: [
              "Advantages: higher availability, read scaling, safer maintenance windows.",
              "Disadvantages: more cost, replication lag, and write throughput is still bounded by the primary.",
            ],
          },
          {
            heading: "When to use it",
            body: [
              "Any production system with a real availability target. Below that, scheduled backups may be enough.",
            ],
          },
        ],
      ),
    ],
  },
  {
    id: "reliability",
    name: "Reliability",
    description: "Staying up when components inevitably fail.",
    topics: [
      "High Availability",
      "Fault Tolerance",
      "Circuit Breaker",
      "Retries",
      "Failover",
      "Disaster Recovery",
    ],
    articles: [
      a("high-availability", "High Availability & Multi-AZ", "Removing zone-level single points of failure.", 4, [
        {
          heading: "The rule",
          body: [
            "Every tier that matters should exist in at least two availability zones behind a load balancer.",
            "One zone is a single fault domain: power, network and cooling are shared.",
          ],
        },
      ]),
      a("fault-tolerance", "Fault Tolerance", "Design for partial failure, not perfect uptime.", 4, [
        {
          heading: "Principles",
          body: [
            "Isolate failures with bulkheads, timeouts and back-pressure.",
            "Prefer degraded service over total outage: serve cached or partial data when a dependency is down.",
          ],
        },
      ]),
      a("circuit-breaker", "Circuit Breaker & Retries", "Stop cascading failures between services.", 4, [
        {
          heading: "How it works",
          body: [
            "After a failure threshold the breaker opens and calls fail fast instead of piling up.",
            "A half-open probe checks recovery before normal traffic resumes.",
          ],
        },
        {
          heading: "Retry safely",
          body: ["Retry only idempotent operations, with exponential backoff and jitter, and always with a budget."],
        },
      ]),
      a("disaster-recovery", "Disaster Recovery", "RTO, RPO and backups you have actually restored.", 5, [
        {
          heading: "Define the targets",
          body: [
            "RTO is how long you may take to recover; RPO is how much data you may lose.",
            "These two numbers determine whether you need backups, warm standby, or active-active.",
          ],
        },
        {
          heading: "The rule that matters",
          body: ["An untested backup is not a backup. Schedule restore drills."],
        },
      ]),
    ],
  },
  {
    id: "security",
    name: "Security",
    description: "Protecting data, identity and the network edge.",
    topics: [
      "Authentication",
      "Authorization",
      "OAuth2",
      "JWT",
      "Zero Trust",
      "Encryption",
      "TLS",
      "OWASP",
      "Secrets Management",
    ],
    articles: [
      a("authentication", "Authentication & Authorization", "Who you are versus what you may do.", 5, [
        {
          heading: "Separate the two",
          body: [
            "Authentication proves identity; authorization evaluates permissions on every request.",
            "Never store roles on the user profile record a client can influence.",
          ],
        },
        {
          heading: "Where to enforce it",
          body: ["Validate tokens at the gateway, and re-check authorization inside each service."],
        },
      ]),
      a("zero-trust", "Zero Trust & Private Subnets", "Never trust the network, always verify the caller.", 5, [
        {
          heading: "Network posture",
          body: [
            "Data stores belong in private subnets, reachable only from the service tier's security group.",
            "Public subnets hold only the load balancer, NAT and bastion-style entry points.",
          ],
        },
        {
          heading: "Why the engine treats it as critical",
          body: ["A publicly reachable database is the single most common catastrophic cloud misconfiguration."],
        },
      ]),
      a("owasp", "WAF & the OWASP Top 10", "Filtering hostile traffic before it reaches your app.", 4, [
        {
          heading: "What a WAF catches",
          body: [
            "Injection attempts, common bot patterns, credential stuffing and volumetric abuse at layer 7.",
            "It is a control at the edge, not a replacement for input validation in the application.",
          ],
        },
      ]),
      a("secrets-management", "Secrets Management", "Credentials belong in a vault, not in your repo.", 4, [
        {
          heading: "Rules",
          body: [
            "Store secrets in a managed vault with rotation and audit logging.",
            "Grant access by workload identity, never by shared static key.",
          ],
        },
      ]),
      a("encryption", "Encryption & TLS", "Protecting data at rest and in transit.", 4, [
        {
          heading: "In transit",
          body: ["TLS everywhere, including between internal services — internal networks are not trusted."],
        },
        {
          heading: "At rest",
          body: ["Managed keys are the baseline; customer-managed keys when compliance requires key custody."],
        },
      ]),
    ],
  },
  {
    id: "cloud",
    name: "Cloud",
    description: "Provider building blocks and how they map to each other.",
    topics: ["AWS", "Azure", "GCP", "Networking", "Storage", "Compute", "Databases"],
    articles: [
      a("cloud-mapping", "Mapping Services Across AWS, Azure and GCP", "The same building blocks, three vocabularies.", 5, [
        {
          heading: "Edge & routing",
          body: ["CloudFront / Azure CDN / Cloud CDN. Route 53 / Azure DNS / Cloud DNS."],
        },
        {
          heading: "Compute",
          body: ["EC2 / Virtual Machines / Compute Engine. Lambda / Functions / Cloud Functions."],
        },
        {
          heading: "Data",
          body: ["RDS / Azure SQL / Cloud SQL. DynamoDB / Cosmos DB / Firestore. ElastiCache / Redis Cache / Memorystore."],
        },
      ]),
    ],
  },
  {
    id: "performance",
    name: "Performance",
    description: "Latency budgets and the layers that protect them.",
    topics: ["Caching", "CDN", "Async Processing", "Message Queues", "Database Optimization"],
    articles: [
      a("cdn", "CDN & Edge Delivery", "Move bytes closer to the user.", 3, [
        {
          heading: "What to put at the edge",
          body: ["Static assets, images, and cacheable API responses with sane cache-control headers."],
        },
      ]),
      a("message-queues", "Async Processing & Message Queues", "Take slow work off the request path.", 4, [
        {
          heading: "Pattern",
          body: [
            "Accept the request, enqueue the job, return immediately, and notify on completion.",
            "Queues also flatten spikes so the database sees a steady rate.",
          ],
        },
      ]),
    ],
  },
  {
    id: "cost",
    name: "Cost Optimization",
    description: "Spending in proportion to the traffic you actually serve.",
    topics: [
      "Right Sizing",
      "Auto Scaling",
      "Storage Optimization",
      "Reserved Capacity",
      "Spot Instances",
      "Cloud Cost Monitoring",
    ],
    articles: [
      a("right-sizing", "Right Sizing & Elasticity", "Idle capacity is the largest avoidable cloud bill.", 4, [
        {
          heading: "Approach",
          body: [
            "Measure real utilisation, then size to p95 with auto scaling covering the peaks.",
            "Reserve or commit only the baseline you are confident about.",
          ],
        },
      ]),
      a("storage-optimization", "Storage Tiering", "Cold data does not belong on hot storage.", 3, [
        {
          heading: "Lifecycle rules",
          body: ["Transition objects to infrequent-access and archive tiers automatically by age."],
        },
      ]),
    ],
  },
  {
    id: "observability",
    name: "Observability",
    description: "Knowing what the system is doing before users tell you.",
    topics: ["Metrics", "Centralized Logging", "Distributed Tracing", "Alerting", "SLOs"],
    articles: [
      a("observability", "Monitoring, Logging & Tracing", "The three signals and what each one answers.", 5, [
        {
          heading: "Metrics",
          body: ["Cheap, aggregate, alertable. They tell you that something is wrong."],
        },
        {
          heading: "Logs",
          body: ["Centralised and structured. They tell you what happened, and satisfy audit requirements."],
        },
        {
          heading: "Traces",
          body: ["Per-request spans across services. They tell you where the latency actually went."],
        },
      ]),
    ],
  },
  {
    id: "interview",
    name: "Interview Preparation",
    description: "Defend your design the way an interviewer will probe it.",
    topics: [
      "System Design Questions",
      "Architecture Scenarios",
      "Scalability Questions",
      "Security Questions",
      "Cloud Architecture Questions",
    ],
    articles: [
      a("interview-scaling", "\"How would you scale this to 10M users?\"", "A repeatable answer structure.", 5, [
        {
          heading: "Structure the answer",
          body: [
            "Clarify traffic shape and read/write ratio, then state the bottleneck you expect first.",
            "Walk the path: CDN, load balancer, stateless services with auto scaling, cache, then data partitioning.",
          ],
        },
        {
          heading: "Close with trade-offs",
          body: ["Name what you gave up — consistency, cost or operational complexity — and why it was acceptable."],
        },
      ]),
    ],
  },
];

export const ALL_ARTICLES: Article[] = KNOWLEDGE.flatMap((c) => c.articles);

export const findArticle = (slug: string) => ALL_ARTICLES.find((art) => art.slug === slug);