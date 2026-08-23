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

const KNOWLEDGE_BASE: KnowledgeCategory[] = [
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
        8,
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
          {
            heading: "Design checklist",
            body: [
              "Give each service one clear business capability, an owner, an API contract, and an explicit data ownership boundary.",
              "Keep synchronous calls short and intentional. Push long-running work to a queue and make consumers idempotent.",
              "Define timeouts, retry budgets, health checks, and distributed tracing before the first production incident.",
            ],
          },
          {
            heading: "Common failure mode",
            body: [
              "A distributed monolith has many services but still requires every service to deploy and release together.",
              "If a service cannot be changed, tested, or operated independently, splitting it out may have added network cost without adding autonomy.",
            ],
          },
        ],
      ),
      a(
        "event-driven",
        "Event-Driven Architecture",
        "Decoupling producers from consumers using events.",
        7,
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
          {
            heading: "Delivery semantics",
            body: [
              "At-most-once delivery can lose messages, while at-least-once delivery can deliver duplicates. Most production systems choose at-least-once and make consumers idempotent.",
              "Exactly-once behavior is usually achieved at the business level with deduplication keys, transactional state changes, and careful replay handling.",
            ],
          },
          {
            heading: "Operational checklist",
            body: [
              "Version event schemas, publish correlation IDs, monitor consumer lag, and alert on dead-letter queue depth.",
              "Document which events are facts, which consumers are allowed to react, and how a failed event is safely replayed.",
            ],
          },
        ],
      ),
      a(
        "modular-monolith",
        "Modular Monolith",
        "A disciplined starting point that keeps deployment simple while preserving clear boundaries.",
        7,
        [
          {
            heading: "The shape",
            body: [
              "A modular monolith is one deployable application split into explicit business modules with private data access and stable contracts.",
              "It gives a team local reasoning and low operational overhead without forcing every boundary to become a network call.",
            ],
          },
          {
            heading: "When it wins",
            body: [
              "Choose it when the domain is still changing, the team is small, or independent scaling is not yet a real requirement.",
              "Keep module boundaries strong so a future extraction is a choice, not a rescue project.",
            ],
          },
          {
            heading: "Boundary rules",
            body: [
              "Modules communicate through application services or domain events instead of reaching directly into another module's tables.",
              "Keep a dependency test in CI so new imports cannot silently create cycles or bypass the public module API.",
            ],
          },
          {
            heading: "Migration path",
            body: [
              "Measure real coupling before extracting anything. Start by moving a module behind a stable interface, then separate its data and deployment only when the operational benefit is clear.",
            ],
          },
        ],
      ),
      a(
        "cqrs",
        "CQRS: Separate Reads and Writes",
        "Use different models when read and write workloads have different needs.",
        8,
        [
          {
            heading: "Core idea",
            body: [
              "Command Query Responsibility Segregation keeps state-changing commands separate from read-optimised queries.",
              "The read model can be denormalised and indexed for the product experience while the write model protects domain invariants.",
            ],
          },
          {
            heading: "Trade-offs",
            body: [
              "CQRS can improve performance and clarity, but it introduces projection lag, more storage, and operational complexity.",
              "Start with one model unless the workload or domain rules justify the split.",
            ],
          },
          {
            heading: "Projection design",
            body: [
              "Build read projections from durable domain events or a change stream, and make projection handlers safe to restart from a checkpoint.",
              "Expose projection freshness when stale data could surprise users, especially for balances, inventory, and permissions.",
            ],
          },
          {
            heading: "Good use cases",
            body: [
              "CQRS is useful when dashboards need many read shapes, when writes require complex invariants, or when reads and writes scale independently.",
              "It is not a synonym for event sourcing: CQRS can use ordinary transactions and a shared database when that is the simpler choice.",
            ],
          },
        ],
      ),
      a(
        "clean-architecture",
        "Clean Architecture",
        "Keep business rules independent from frameworks, databases, and delivery mechanisms.",
        7,
        [
          {
            heading: "Dependency direction",
            body: [
              "Dependencies point inward toward policies and use cases; infrastructure depends on the application core, never the reverse.",
              "This makes the core easier to test and keeps vendor choices at the edge of the system.",
            ],
          },
          {
            heading: "Practical test",
            body: ["If a unit test needs a database or HTTP server to verify a business rule, the boundary is probably in the wrong place."],
          },
          {
            heading: "Layers that matter",
            body: [
              "Keep entities and use cases at the centre, adapters around them, and infrastructure implementations at the outer edge.",
              "Dependency inversion means the core defines the interface it needs; a database adapter implements that interface.",
            ],
          },
          {
            heading: "Avoid over-engineering",
            body: ["Clean Architecture is a dependency rule, not a requirement to create dozens of folders. Use the smallest number of boundaries that keep business decisions independent."],
          },
        ],
      ),
      a(
        "serverless-patterns",
        "Serverless Architecture",
        "Trade infrastructure management for event-driven execution and usage-based cost.",
        7,
        [
          {
            heading: "Best fit",
            body: [
              "Serverless works well for bursty APIs, scheduled jobs, event consumers, and workloads with clear execution boundaries.",
              "Pair functions with managed queues, object storage, and observability rather than rebuilding platform services yourself.",
            ],
          },
          {
            heading: "Watch-outs",
            body: ["Cold starts, execution limits, vendor coupling, and distributed debugging need explicit design decisions."],
          },
          {
            heading: "Reliable function design",
            body: [
              "Keep handlers small, validate input at the boundary, make retries safe, and send long work to a durable queue instead of extending request timeouts.",
              "Use correlation IDs and structured logs because one user request may cross several short-lived functions.",
            ],
          },
          {
            heading: "Cost model",
            body: ["Serverless is inexpensive when execution is intermittent, but sustained high throughput can make reserved containers or dedicated compute more predictable. Model both idle and peak cost before committing."],
          },
        ],
      ),
      a(
        "distributed-systems-basics",
        "Distributed Systems Fundamentals",
        "Reason about time, failure, consistency, and coordination across machines.",
        9,
        [
          {
            heading: "The hard parts",
            body: [
              "Networks fail, clocks disagree, messages arrive late or twice, and a healthy service can be unreachable from another healthy service.",
              "Design with timeouts, retries, idempotency, back-pressure, and clear ownership of state.",
            ],
          },
          {
            heading: "Consistency is a product choice",
            body: ["Choose strong consistency only where users or business rules require it; use eventual consistency deliberately where it buys resilience and scale."],
          },
          {
            heading: "Failure-aware communication",
            body: [
              "Every remote call needs a timeout shorter than the caller's deadline. Retries need exponential backoff, jitter, and a maximum attempt budget.",
              "Circuit breakers, bulkheads, and back-pressure stop one unhealthy dependency from consuming every worker thread or connection.",
            ],
          },
          {
            heading: "A practical review",
            body: [
              "Trace the critical request across services and ask what happens when each dependency is slow, unavailable, duplicated, or only partially updated.",
              "Then identify the source of truth, the recovery action, and the user-visible behavior for every failure case.",
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
  // ────────────────────────────────────────────────────────────────
  // Database Decisions
  // ────────────────────────────────────────────────────────────────
  {
    id: "databases",
    name: "Database Decisions",
    description: "Choosing the right database — and knowing when your choice creates problems.",
    topics: ["SQL vs NoSQL", "CAP Theorem", "Sharding", "Partitioning", "Indexing", "ACID", "Consistency Models"],
    articles: [
      a("sql-vs-nosql", "SQL vs NoSQL", "Two different tools — not competitors.", 6, [
        {
          heading: "SQL databases",
          body: [
            "Relational databases enforce a schema, support ACID transactions, and allow complex multi-table joins.",
            "Use SQL for: user accounts, orders, payments, inventory — any domain with structured relationships and strong consistency requirements.",
          ],
        },
        {
          heading: "NoSQL databases",
          body: [
            "Document, key-value, wide-column and graph databases trade relational expressiveness for horizontal scalability and flexible schemas.",
            "Use NoSQL for: session data, product catalogs with variable attributes, social graphs, real-time analytics counters, and access patterns that are simple and predictable.",
          ],
        },
        {
          heading: "When to choose each",
          body: [
            "SQL if: you need multi-entity ACID transactions, ad-hoc reporting queries, or the schema is well-understood and stable.",
            "NoSQL if: you need horizontal write scaling, the access patterns are known and simple (key lookups, range scans), or the schema is highly variable.",
          ],
        },
        {
          heading: "The bad choice to avoid",
          body: [
            "Choosing NoSQL because it sounds more scalable, then discovering you need joins. Rewriting a SQL workload into a NoSQL schema that needs joins is painful.",
          ],
        },
      ]),
      a("cap-theorem", "CAP Theorem & Consistency Models", "Why distributed systems can't have everything.", 5, [
        {
          heading: "The theorem",
          body: [
            "A distributed system can guarantee at most two of: Consistency (every read sees the latest write), Availability (every request gets a response), and Partition Tolerance (the system works despite network splits).",
            "Since network partitions are inevitable in production, you always choose between CP (consistent but may reject requests) and AP (available but may return stale data).",
          ],
        },
        {
          heading: "In practice",
          body: [
            "Strong consistency: all reads reflect the latest write. Required for payments, financial ledgers, inventory decrement.",
            "Eventual consistency: reads may be slightly stale but the system always responds. Acceptable for social feeds, product views, analytics.",
          ],
        },
        {
          heading: "PACELC extension",
          body: [
            "Even without a partition, there is a trade-off: lower latency or stronger consistency. This is why DynamoDB offers configurable read consistency.",
          ],
        },
      ]),
      a("sharding", "Sharding & Partitioning", "Splitting data to scale writes beyond one machine.", 6, [
        {
          heading: "What it is",
          body: [
            "Sharding splits a database horizontally — each shard holds a subset of the data. Partitioning is the same concept at the table level within one node.",
          ],
        },
        {
          heading: "Partition key choice",
          body: [
            "A good partition key distributes writes evenly. A bad one (e.g. user country for a US-centric app) creates hot partitions that re-introduce the bottleneck.",
            "Hash-based sharding distributes evenly but makes range queries require scatter-gather across all shards.",
          ],
        },
        {
          heading: "When to shard",
          body: [
            "Shard only when a single-node primary cannot handle write throughput after you have: exhausted vertical scaling, applied indexing, and used read replicas.",
            "Sharding adds enormous operational complexity. Consider managed alternatives (Spanner, CockroachDB, Aurora Limitless) first.",
          ],
        },
      ]),
      a("indexing", "Database Indexing", "The single most impactful performance optimization you can make.", 4, [
        {
          heading: "What an index does",
          body: [
            "An index is a data structure that maps column values to row locations, so the engine can find rows without scanning the entire table.",
            "Without an index, a SELECT with a WHERE clause performs a full table scan — O(n) per query.",
          ],
        },
        {
          heading: "EXPLAIN ANALYZE",
          body: [
            "Run EXPLAIN ANALYZE on slow queries to see whether the planner uses an index or a sequential scan.",
            "Add indexes on columns that appear in WHERE, JOIN ON, and ORDER BY clauses, weighted by query frequency.",
          ],
        },
        {
          heading: "Trade-offs",
          body: [
            "Each index speeds up reads but slows down inserts, updates and deletes (the index must be updated too).",
            "Don't index every column — index the columns your slowest, most frequent queries filter on.",
          ],
        },
      ]),
    ],
  },
  // ────────────────────────────────────────────────────────────────
  // Distributed Systems
  // ────────────────────────────────────────────────────────────────
  {
    id: "distributed-systems",
    name: "Distributed Systems",
    description: "The patterns that keep services alive when things inevitably go wrong.",
    topics: ["Sync vs Async", "Idempotency", "Dead-Letter Queue", "Circuit Breaker", "Rate Limiting", "Backpressure"],
    articles: [
      a("sync-vs-async", "Synchronous vs Asynchronous Architecture", "The most important architectural decision in a distributed system.", 6, [
        {
          heading: "Synchronous (request-response)",
          body: [
            "The caller blocks until the callee responds. Simple to reason about, easy to propagate errors.",
            "Risk: if the downstream service is slow, latency compounds across the entire call chain. One slow service can stall every upstream caller.",
          ],
        },
        {
          heading: "Asynchronous (message-driven)",
          body: [
            "The caller enqueues a message and returns immediately. The worker processes it independently.",
            "Benefits: isolates failures, flattens traffic spikes, enables independent scaling and retries.",
          ],
        },
        {
          heading: "When to use which",
          body: [
            "Synchronous: user-facing reads that require a real-time response (e.g. auth check, product page, search).",
            "Asynchronous: anything that does not need an immediate result — email delivery, report generation, payment processing, notifications.",
          ],
        },
        {
          heading: "Hybrid",
          body: [
            "Most production systems are hybrid: synchronous for the user-facing response, asynchronous for the side effects triggered by that response.",
          ],
        },
      ]),
      a("idempotency", "Idempotency & At-Least-Once Delivery", "Why you must design for duplicate messages.", 4, [
        {
          heading: "The problem",
          body: [
            "Every message queue and async system guarantees at-least-once delivery. This means your consumer may process the same message more than once.",
            "A non-idempotent consumer (one that charges a card on every execution) will over-charge users on retries.",
          ],
        },
        {
          heading: "The solution",
          body: [
            "Make every consumer idempotent by tracking a message ID in a deduplication table. If the ID already exists, skip processing.",
            "This is especially critical for payment, order and inventory operations.",
          ],
        },
      ]),
      a("dead-letter-queue", "Dead-Letter Queue (DLQ)", "What happens to messages that always fail.", 4, [
        {
          heading: "What it is",
          body: [
            "A DLQ is a separate queue where messages land after they have failed the maximum number of retries.",
            "Without a DLQ, poison messages loop forever, consuming worker capacity and blocking other messages.",
          ],
        },
        {
          heading: "What to do with DLQ messages",
          body: [
            "Alert on DLQ depth in your monitoring system — it means your consumer has a bug or the message is malformed.",
            "Inspect, fix the bug, and replay from the DLQ once the consumer is correct.",
          ],
        },
        {
          heading: "Configuration",
          body: [
            "Set a max receive count (typically 3–5 retries) after which messages move to the DLQ automatically.",
            "Set a visibility timeout long enough for your consumer to finish processing before the message becomes visible again.",
          ],
        },
      ]),
      a("rate-limiting-pattern", "Rate Limiting & Throttling", "Protecting your API from abuse and accidental overload.", 4, [
        {
          heading: "Why it matters",
          body: [
            "Without rate limiting, a single buggy client or malicious actor can exhaust your compute, database or downstream API quota.",
            "Rate limiting is a first-class reliability and security control, not an afterthought.",
          ],
        },
        {
          heading: "Algorithms",
          body: [
            "Token bucket: allows bursts up to the bucket size. Good for user-facing APIs.",
            "Sliding window: smoother than fixed window, prevents boundary-edge abuse.",
            "Fixed window: simplest but allows 2× burst at window boundaries.",
          ],
        },
        {
          heading: "Implementation",
          body: [
            "Implement at the API Gateway or WAF layer for shared limits. Use Redis with atomic INCR + EXPIRE for distributed per-user counters.",
          ],
        },
      ]),
    ],
  },
  // ────────────────────────────────────────────────────────────────
  // Architecture Templates
  // ────────────────────────────────────────────────────────────────
  {
    id: "templates",
    name: "Architecture Templates",
    description: "Real-world patterns used in production systems — study the why, not just the what.",
    topics: ["E-Commerce", "URL Shortener", "Chat Application", "Video Streaming", "Notification System"],
    articles: [
      a("template-ecommerce", "E-Commerce Architecture", "The canonical multi-tier production pattern.", 7, [
        {
          heading: "Request flow",
          body: [
            "Users → CloudFront (CDN) → WAF → Application Load Balancer → API Gateway → Microservices.",
            "CloudFront serves static assets and cacheable product pages. WAF blocks OWASP attacks before they reach the origin.",
          ],
        },
        {
          heading: "Data layer",
          body: [
            "PostgreSQL (RDS/Aurora) for orders, users, inventory — ACID required.",
            "Redis (ElastiCache) for sessions, product page caches, rate limiting counters.",
            "DynamoDB / Firestore for product catalog with variable attributes.",
            "S3 for product images, receipts, exports.",
          ],
        },
        {
          heading: "Async layer",
          body: [
            "Order placed → SQS → Order Worker → Payment Service (synchronous call with circuit breaker) → SNS → Email/SMS.",
            "Async processing prevents the checkout response from waiting for email delivery.",
          ],
        },
        {
          heading: "Key design decisions",
          body: [
            "Inventory decrement: synchronous with optimistic locking to prevent oversell.",
            "Cart: Redis with TTL — acceptably lost if Redis restarts.",
            "Payment: synchronous, idempotent, with retry + circuit breaker on the payment provider.",
          ],
        },
      ]),
      a("template-url-shortener", "URL Shortener Architecture", "A classic system design interview problem.", 6, [
        {
          heading: "Requirements analysis",
          body: [
            "Write: 100 URLs/sec. Read: 10,000 redirects/sec (100:1 read:write ratio). Availability: 99.99%. Latency: <10ms redirect.",
          ],
        },
        {
          heading: "Core design",
          body: [
            "Write path: API → ID generator (Base62 encode of distributed counter or hash) → DynamoDB (shortCode → originalURL).",
            "Read path: API → Redis cache (shortCode → originalURL, TTL 24h) → DynamoDB on cache miss → 301 redirect.",
          ],
        },
        {
          heading: "Why Redis is critical here",
          body: [
            "With 10,000 RPS and <10ms target, hitting DynamoDB on every redirect would saturate the table and add 5–10ms per request.",
            "Redis serves the 90%+ cache-hit rate in <1ms.",
          ],
        },
        {
          heading: "Scale considerations",
          body: [
            "Stateless API tier auto-scales behind an ALB.",
            "DynamoDB scales horizontally — partition key is the short code (evenly distributed after Base62 encoding).",
          ],
        },
      ]),
      a("template-chat", "Real-Time Chat Architecture", "WebSockets, fan-out, and message persistence.", 7, [
        {
          heading: "Core challenge",
          body: [
            "HTTP is request-response — the client must poll. WebSockets give a persistent bidirectional channel, enabling true push.",
          ],
        },
        {
          heading: "Architecture",
          body: [
            "Client → Load Balancer (NLB for WebSocket stickiness) → Chat Service (stateful WebSocket handler) → Pub/Sub (Redis or SNS) → Recipient Chat Service → Client.",
            "Each chat server subscribes to a channel per user. When a message arrives, it publishes to the channel, and every server subscribed for that user pushes the message.",
          ],
        },
        {
          heading: "Message persistence",
          body: [
            "Messages stored in Cassandra or DynamoDB — wide-column databases are ideal for time-series chat history: (conversation_id, timestamp) as the key.",
            "Recent messages (last 100) cached in Redis for fast load.",
          ],
        },
        {
          heading: "Presence",
          body: [
            "Heartbeat every 30s updates a Redis key with TTL 60s. If the key expires, the user is offline.",
          ],
        },
      ]),
      a("template-notification", "Notification System Architecture", "Fan-out to millions with reliability.", 5, [
        {
          heading: "Pattern",
          body: [
            "Application → Message Queue (SQS/Pub/Sub) → Notification Workers (one per channel: email, SMS, push).",
            "Decoupling via queue means the main application is never blocked by slow email/SMS delivery.",
          ],
        },
        {
          heading: "Reliability",
          body: [
            "Retry with exponential backoff on transient failures (network, provider timeout).",
            "Dead-letter queue for permanently-failed messages — these are inspected and replayed after fixing the root cause.",
            "Idempotency key per notification prevents duplicate sends on retry.",
          ],
        },
        {
          heading: "Scale",
          body: [
            "For fan-out to millions (e.g. broadcast), use a fan-out pattern: one SNS topic → multiple SQS queues → multiple worker pools in parallel.",
          ],
        },
      ]),
    ],
  },
  // ────────────────────────────────────────────────────────────────
  // Architecture Comparisons
  // ────────────────────────────────────────────────────────────────
  {
    id: "comparisons",
    name: "Architecture Comparisons",
    description: "Side-by-side analysis of the most commonly confused technology choices.",
    topics: ["Load Balancer vs API Gateway", "Kafka vs SQS", "SQL vs NoSQL", "EC2 vs Lambda vs ECS", "Redis vs Memcached"],
    articles: [
      a("alb-vs-apigw", "Load Balancer vs API Gateway", "Two traffic controllers with very different purposes.", 5, [
        {
          heading: "Load Balancer",
          body: [
            "Operates at Layer 4 (TCP/UDP) or Layer 7 (HTTP). Distributes traffic across healthy instances based on health checks.",
            "Does NOT understand: authentication, API versioning, request transformation, throttling, or response aggregation.",
            "Use when: you have multiple instances of the same service and need even traffic distribution.",
          ],
        },
        {
          heading: "API Gateway",
          body: [
            "Operates at Layer 7. Adds: authentication enforcement, rate limiting, request routing by path/method, transformation, and response caching.",
            "Does NOT replace a load balancer — typically sits in front of one or directly in front of a single service.",
            "Use when: you have multiple downstream services and need a governed, observable entry point.",
          ],
        },
        {
          heading: "Combined pattern",
          body: [
            "Client → API Gateway (auth, routing, throttle) → ALB (distribute) → Service Instances.",
            "At small scale: Client → API Gateway → single service. No ALB needed until you have multiple instances.",
          ],
        },
      ]),
      a("kafka-vs-sqs", "Kafka vs SQS / Cloud Pub-Sub", "High-throughput streaming vs managed simple queues.", 5, [
        {
          heading: "When to use Kafka",
          body: [
            "You need message replay (consumers can re-read past events). You need strict ordering within a partition. You need very high throughput (millions of events/sec). You are building event sourcing or CQRS.",
            "Cost: high operational complexity, requires schema management, expertise required.",
          ],
        },
        {
          heading: "When to use SQS / Cloud Tasks / Service Bus",
          body: [
            "You need reliable task queuing. You do not need replay. Order is not critical (or FIFO queues satisfy you). Your team is small or operational simplicity is a priority.",
            "Cost: near zero operational overhead — fully managed, scales automatically.",
          ],
        },
        {
          heading: "The mistake",
          body: [
            "Choosing Kafka because it sounds more scalable, then spending 3 months tuning it for a workload that SQS would have handled in 1 day.",
          ],
        },
      ]),
      a("ec2-vs-lambda-vs-ecs", "EC2 vs Lambda vs ECS vs EKS", "Picking the right compute for your workload.", 6, [
        {
          heading: "EC2",
          body: ["Full control. You manage the OS, patching, scaling. Best for: legacy apps, GPU workloads, custom OS requirements, predictable steady traffic with reserved instances."],
        },
        {
          heading: "Lambda / Cloud Functions",
          body: ["Zero infrastructure. Pay per invocation. Best for: event-driven handlers, lightweight APIs, scheduled jobs, sporadic workloads. Worst for: high CPU tasks, cold-start-sensitive paths."],
        },
        {
          heading: "ECS Fargate / Cloud Run / Container Apps",
          body: ["Containers without a cluster to manage. Best for: containerized workloads where you want Kubernetes-style isolation without the control plane complexity. The default choice for most new microservices."],
        },
        {
          heading: "EKS / GKE / AKS (Kubernetes)",
          body: ["Full container orchestration for large fleets. Best for: large engineering organizations (10+ services, multiple teams), complex scheduling requirements. Worst for: small teams — the operational overhead is significant."],
        },
      ]),
    ],
  },
  // ────────────────────────────────────────────────────────────────
  // Capacity Planning
  // ────────────────────────────────────────────────────────────────
  {
    id: "capacity",
    name: "Capacity Planning",
    description: "Estimating load before you build — the first step of every real system design interview.",
    topics: ["RPS Estimation", "Storage Estimation", "Bandwidth", "Database Sizing", "Back-of-Envelope"],
    articles: [
      a("back-of-envelope", "Back-of-Envelope Estimation", "The skill interviewers use to separate engineers who understand scale.", 6, [
        {
          heading: "Why it matters",
          body: [
            "Before choosing a technology, estimate the numbers. A system handling 100 RPS needs completely different architecture than one handling 1M RPS.",
            "Back-of-envelope calculations give you a defensible basis for every architectural decision.",
          ],
        },
        {
          heading: "Key numbers to memorize",
          body: [
            "1 million seconds ≈ 11.5 days. 1 billion seconds ≈ 31.7 years.",
            "Typical RPS: 1K users * 10 requests/day / 86,400 sec = ~0.1 RPS. Scale up linearly.",
            "Peak traffic is typically 2–3× average. Design for peak.",
            "P99 latency is what users experience — not average.",
          ],
        },
        {
          heading: "RPS to instance count",
          body: [
            "A typical web API instance handles 1,000–5,000 RPS depending on work per request.",
            "At 100,000 RPS: 20–100 instances behind a load balancer with auto scaling.",
            "At 1M RPS: serverless or a large cluster with careful profiling.",
          ],
        },
        {
          heading: "Storage estimation",
          body: [
            "Users × average record size × years of retention = total storage.",
            "Example: 10M users × 1 KB profile = 10 GB. Trivial. Add 100 posts × 1 KB = 10 TB — needs partitioning.",
          ],
        },
        {
          heading: "Database sizing",
          body: [
            "A single PostgreSQL primary can handle ~10K–50K simple reads/sec and ~5K–20K writes/sec depending on hardware.",
            "Above these limits: add read replicas for reads, and consider sharding or a distributed database for writes.",
          ],
        },
      ]),
      a("performance-budgets", "Latency Budgets & SLOs", "Designing to a number, not to a feeling.", 4, [
        {
          heading: "SLO vs SLA",
          body: [
            "SLO (Service Level Objective): internal target — 'p99 API latency < 100ms'.",
            "SLA (Service Level Agreement): external contractual commitment — 'we guarantee 99.9% uptime'.",
            "Operate to a tighter SLO than your SLA to have room to absorb incidents without breaching the contract.",
          ],
        },
        {
          heading: "Latency budget",
          body: [
            "A latency budget allocates the allowed time across each tier. Example for a 100ms SLO: CDN 5ms + LB 2ms + API 30ms + Cache hit 5ms / DB 40ms + response 18ms.",
            "If the DB takes 80ms, the budget is broken — you either need to add a cache, optimize the query, or loosen the SLO.",
          ],
        },
        {
          heading: "Availability maths",
          body: [
            "99% = 87.6 hours downtime/year. 99.9% = 8.7 hours. 99.99% = 52 minutes. 99.999% = 5 minutes.",
            "Multiple dependencies multiply downtime: two 99.9% services in series = 99.8% availability (1 - (0.001 + 0.001)).",
          ],
        },
      ]),
    ],
  },
];

export interface LearningPathGuide {
  id: string;
  definition: string;
  contents: string[];
}

export const LEARNING_PATH: LearningPathGuide[] = [
  {
    id: "patterns",
    definition: "System design patterns are reusable ways to organize software components and the communication between them. They give you a vocabulary for common problems such as scaling traffic, isolating failures, processing work asynchronously, or keeping code easy to change. A pattern is a starting point, not a rule: choose it only after understanding the workload, team size, reliability needs, and operational cost it introduces.",
    contents: ["Client-Server Architecture", "Layered Architecture", "Microservices Architecture", "Monolithic Architecture", "Event-Driven Architecture", "Service-Oriented Architecture (SOA)", "CQRS", "Event Sourcing", "Saga Pattern", "Circuit Breaker Pattern", "Retry Pattern", "Bulkhead Pattern", "Strangler Fig Pattern", "API Gateway Pattern", "Sidecar Pattern", "Pub/Sub Pattern", "Load Balancing Pattern", "Cache-Aside Pattern", "Database-per-Service Pattern", "Leader-Follower Architecture"],
  },
  {
    id: "scalability",
    definition: "Scalability is a system's ability to keep serving users as traffic, data, or workload increases. Vertical scaling makes one machine larger, while horizontal scaling adds more machines or service instances; most large systems use a combination of both. Good scaling design begins by finding bottlenecks, separating stateless work from stateful storage, and measuring how cost and latency change as demand grows.",
    contents: ["Vertical Scaling", "Horizontal Scaling", "Auto Scaling", "Load Balancing", "Stateless Services", "Distributed Systems", "Database Scaling", "Read Replicas", "Database Sharding", "Partitioning", "Caching", "CDN", "Asynchronous Processing", "Message Queues", "Service Decomposition", "Microservices", "Distributed Caching", "Connection Pooling", "Rate Limiting", "Capacity Planning"],
  },
  {
    id: "reliability",
    definition: "Reliability means a system continues to provide correct behavior over time, including when machines, networks, dependencies, or deployments fail. It includes detection, isolation, graceful degradation, recovery, and data protection—not just keeping servers running. Beginners should learn to ask what can fail, how users will experience that failure, and how the system will recover without creating duplicate work or data loss.",
    contents: ["Fault Tolerance", "High Availability", "Redundancy", "Replication", "Failover", "Health Checks", "Heartbeats", "Disaster Recovery", "Backup and Restore", "Multi-AZ Deployment", "Multi-Region Architecture", "Automatic Recovery", "Retry Mechanisms", "Circuit Breakers", "Bulkheads", "Graceful Degradation", "Failure Detection", "Data Durability", "RPO", "RTO", "Chaos Engineering"],
  },
  {
    id: "security",
    definition: "Security is the practice of protecting identities, applications, infrastructure, and data from unauthorized actions and accidental exposure. A secure design verifies who a caller is, what they are allowed to do, where sensitive data can travel, and how suspicious activity is detected. Security is layered: authentication, authorization, network boundaries, encryption, secrets management, validation, patching, and audit trails work together rather than replacing one another.",
    contents: ["Authentication", "Authorization", "IAM", "OAuth 2.0", "OpenID Connect", "JWT", "Session Management", "RBAC", "Encryption at Rest", "Encryption in Transit", "TLS/SSL", "Password Hashing", "API Security", "Rate Limiting", "Input Validation", "SQL Injection Prevention", "XSS Prevention", "CSRF Protection", "Secrets Management", "Network Security", "Firewalls", "WAF", "Zero Trust Architecture", "Security Logging", "Auditing", "Data Privacy"],
  },
  {
    id: "cloud",
    definition: "Cloud architecture uses provider-managed computing, storage, networking, databases, and security services to build systems without owning physical infrastructure. The cloud offers elasticity and powerful building blocks, but each managed service has limits, pricing rules, and provider-specific behavior. A sound design chooses the simplest service that meets the workload's needs and makes regions, identity, networking, backups, observability, and cost visible from the beginning.",
    contents: ["IaaS", "PaaS", "SaaS", "Public Cloud", "Private Cloud", "Hybrid Cloud", "Multi-Cloud", "Regions", "Availability Zones", "Virtual Machines", "Containers", "Kubernetes", "Serverless Computing", "Object Storage", "Cloud Databases", "Managed Services", "VPC", "Load Balancers", "CDN", "Cloud Monitoring", "IAM", "Auto Scaling", "Infrastructure as Code", "Cloud Deployment Models"],
  },
  {
    id: "performance",
    definition: "Performance describes how quickly and efficiently a system responds while handling its expected workload. Latency is how long one request takes, throughput is how much work the system handles over time, and resource efficiency describes the CPU, memory, network, and storage used to do that work. Improve performance by measuring real bottlenecks first, then use caching, indexing, batching, asynchronous work, connection pooling, or additional capacity where the evidence supports it.",
    contents: ["Latency", "Throughput", "Response Time", "RPS", "QPS", "CPU and Memory Optimization", "Database Optimization", "Indexing", "Query Optimization", "Caching", "CDN", "Connection Pooling", "Compression", "Pagination", "Asynchronous Processing", "Batch Processing", "Load Balancing", "Performance Testing", "Profiling", "Bottleneck Identification", "Horizontal Scaling", "Performance Monitoring"],
  },
  {
    id: "cost",
    definition: "Cost optimization is the discipline of meeting reliability, performance, and growth goals without paying for unnecessary capacity or complexity. Cloud cost comes from compute time, storage, requests, databases, data transfer, observability, and the people needed to operate the system. The cheapest component is not always the best choice: compare total cost, idle capacity, failure impact, engineering effort, and the cost of changing the decision later.",
    contents: ["Resource Right-Sizing", "Auto Scaling", "Reserved Instances", "Savings Plans", "Spot Instances", "Serverless", "Storage Optimization", "Data Transfer Costs", "CDN Optimization", "Database Cost Optimization", "Caching", "Resource Scheduling", "Cloud Usage Monitoring", "Unused Resource Cleanup", "Cost Allocation", "Budget Alerts", "Capacity Planning", "Cost-vs-Performance Trade-offs"],
  },
  {
    id: "observability",
    definition: "Observability lets engineers understand what a system is doing from its outputs: logs describe events, metrics show trends and quantities, and traces follow one request across services. It turns a vague report such as 'the site is slow' into evidence about which dependency, query, or queue is responsible. Useful observability also defines service-level indicators, alerts on user impact, preserves correlation IDs, and avoids collecting sensitive data unnecessarily.",
    contents: ["Logs", "Metrics", "Traces", "Distributed Tracing", "Structured Logging", "APM", "Health Checks", "Alerts", "Dashboards", "Error Tracking", "Request Correlation IDs", "SLIs", "SLOs", "SLAs", "Monitoring", "Prometheus", "Grafana", "OpenTelemetry", "Log Aggregation", "Alert Management", "Root Cause Analysis"],
  },
  {
    id: "interview",
    definition: "System design interviews and real architecture work both require turning an ambiguous product idea into explicit requirements and an explainable design. You estimate traffic, storage, bandwidth, and peak behavior; define APIs and data ownership; then choose components that satisfy reliability, security, latency, and cost goals. The important skill is not naming many technologies—it is explaining assumptions, bottlenecks, failure modes, and trade-offs clearly.",
    contents: ["Functional Requirements", "Non-Functional Requirements", "Capacity Estimation", "Traffic Estimation", "Storage Estimation", "API Design", "Database Selection", "High-Level Design", "Low-Level Design", "Scalability", "Reliability", "Security", "Caching", "Load Balancing", "Message Queues", "CAP Theorem", "Consistency Models", "Distributed Systems", "Trade-offs", "Bottleneck Identification", "Failure Scenarios", "Architecture Diagrams", "Communication Strategy"],
  },
  {
    id: "databases",
    definition: "Database design starts with the data and the queries the product must support, not with a fashionable database brand. Relational databases are strong at structured relationships and transactions; document, key-value, wide-column, and graph stores optimize different access patterns. Decide how data is indexed, partitioned, replicated, backed up, and migrated, and make consistency choices explicit so the application does not accidentally show stale or conflicting results.",
    contents: ["SQL vs NoSQL", "Relational Databases", "Document Databases", "Key-Value Stores", "Wide-Column Databases", "Graph Databases", "ACID Transactions", "BASE", "CAP Theorem", "Database Indexing", "Normalization", "Denormalization", "Replication", "Read Replicas", "Sharding", "Partitioning", "Consistency", "Transactions", "Distributed Databases", "Data Modeling", "Query Optimization", "Polyglot Persistence"],
  },
  {
    id: "distributed-systems",
    definition: "A distributed system is made of independent computers or services that coordinate over a network to behave like one product. Networks can be slow, disconnected, duplicated, or partially failed, so a distributed design must handle timeouts, retries, ordering, consistency, idempotency, and membership changes. Distribution can improve scale and availability, but it also adds coordination and debugging complexity; use it when the benefit justifies that cost.",
    contents: ["Distributed Computing", "CAP Theorem", "Consistency Models", "Strong Consistency", "Eventual Consistency", "Distributed Transactions", "Consensus", "Leader Election", "Replication", "Partitioning", "Sharding", "Distributed Locks", "Message Queues", "Pub/Sub", "Service Discovery", "Clock Synchronization", "Idempotency", "Fault Tolerance", "Network Partitions", "Raft/Paxos", "Exactly-Once Processing", "At-Least-Once Processing", "At-Most-Once Processing"],
  },
  {
    id: "templates",
    definition: "Architecture templates are proven high-level shapes such as a three-tier application, modular monolith, microservices platform, or event-driven pipeline. They help beginners see where clients, gateways, business logic, queues, databases, and operational controls usually fit. Treat a template as a map to adapt: the right structure depends on domain boundaries, traffic shape, team ownership, failure tolerance, and how much operational work the team can support.",
    contents: ["Monolithic Architecture", "Layered Architecture", "Three-Tier Architecture", "Microservices Architecture", "Event-Driven Architecture", "Serverless Architecture", "Hexagonal Architecture", "Clean Architecture", "CQRS Architecture", "Event-Sourcing Architecture", "Pipeline Architecture", "Client-Server Architecture", "Peer-to-Peer Architecture", "Leader-Follower Architecture", "Multi-Region Architecture"],
  },
  {
    id: "comparisons",
    definition: "Architecture comparisons make trade-offs visible when two technically valid choices solve the same problem. For example, a monolith may be faster to build and operate, while microservices can provide independent scaling at the cost of networking and deployment complexity. Compare options using the same workload assumptions, then consider failure behavior, team capability, migration effort, vendor dependence, and the consequences of being wrong.",
    contents: ["Monolith vs Microservices", "SQL vs NoSQL", "Vertical vs Horizontal Scaling", "REST vs GraphQL", "REST vs gRPC", "Synchronous vs Asynchronous Communication", "Message Queue vs Pub/Sub", "SQL vs Document Database", "Cache vs Database", "CDN vs Reverse Proxy", "Serverless vs Containers", "Kubernetes vs Virtual Machines", "Strong vs Eventual Consistency", "Single-Region vs Multi-Region", "Shared Database vs Database-per-Service"],
  },
  {
    id: "capacity",
    definition: "Capacity planning uses rough but explicit calculations to estimate requests, concurrent users, storage growth, bandwidth, peak traffic, and resource needs before implementation. Start with business assumptions such as users, actions per user, payload size, and read/write ratio, then include peak multipliers and safety headroom. Estimates are not promises; they are a way to expose bottlenecks early and decide what must be measured in a load test.",
    contents: ["RPS Estimation", "Storage Estimation", "Bandwidth", "Database Sizing", "Back-of-Envelope Calculations", "Peak Traffic", "Read/Write Ratios", "Latency Budgets", "Growth Modeling", "Capacity Buffers"],
  },
];

const KNOWLEDGE_EXPANSIONS: Record<string, { topics: string[]; articles: Article[] }> = {
  patterns: {
    topics: ["API Design", "Strangler Fig", "Circuit Breakers"],
    articles: [
      a("architecture-boundaries", "Boundaries, Coupling & Cohesion", "How to choose boundaries that keep change local and dependencies understandable.", 6, [
        { heading: "Start with ownership", body: ["A good boundary groups behavior and data that change together, then gives one team clear ownership.", "Avoid splitting around technical layers when the result forces every feature to cross every service."] },
        { heading: "Measure coupling", body: ["Look for shared databases, synchronous call chains, release coordination, and contracts that change together.", "Prefer explicit events or stable interfaces when a dependency must cross a boundary."] },
        { heading: "Keep an escape hatch", body: ["Boundaries should be easy to test and observable in production. A modular monolith can preserve the same boundaries before distributed deployment is justified."] },
      ]),
    ],
  },
  scalability: {
    topics: ["Horizontal Scaling", "Rate Limiting", "Hotspots"],
    articles: [
      a("scaling-strategies", "A Practical Scaling Strategy", "Scale the bottleneck first using replication, partitioning, caching, and asynchronous work.", 6, [
        { heading: "Find the bottleneck", body: ["Measure CPU, memory, connection pools, storage I/O, queue depth, and tail latency before adding capacity."] },
        { heading: "Scale out safely", body: ["Stateless services can scale horizontally behind a load balancer. Move session state and durable work to shared, replicated systems.", "Design idempotent writes before retries and autoscaling increase duplicate work."] },
        { heading: "Protect the system", body: ["Use quotas, backpressure, admission control, and load shedding so overload degrades predictably instead of cascading."] },
      ]),
    ],
  },
  reliability: {
    topics: ["Fault Tolerance", "Disaster Recovery", "Error Budgets"],
    articles: [
      a("reliability-engineering", "Designing for Failure", "A reliability checklist for dependencies, recovery, and graceful degradation.", 6, [
        { heading: "Assume dependency failure", body: ["Every network call needs a timeout, bounded retry policy, fallback behavior, and a clear owner."] },
        { heading: "Recover deliberately", body: ["Define RPO and RTO, automate backups, and rehearse restoration in an isolated environment."] },
        { heading: "Use error budgets", body: ["An error budget turns reliability into an engineering trade-off: spend it on delivery speed, then pause risky change when the budget is exhausted."] },
      ]),
    ],
  },
  security: {
    topics: ["Threat Modeling", "Secrets Management", "Zero Trust"],
    articles: [
      a("secure-by-design", "Security by Design", "Build security controls into identity, data flows, deployment, and observability from the start.", 6, [
        { heading: "Map the threats", body: ["Identify assets, trust boundaries, entry points, abuse cases, and the impact of compromised components."] },
        { heading: "Protect access", body: ["Use least privilege, short-lived credentials, service identities, and centralized policy enforcement. Never treat a private network as authorization."] },
        { heading: "Make incidents actionable", body: ["Centralize audit logs, detect unusual access, rotate secrets, and document containment and recovery steps."] },
      ]),
    ],
  },
  cloud: {
    topics: ["Landing Zones", "Multi-Region", "Managed Services"],
    articles: [
      a("cloud-architecture-basics", "Cloud Architecture Essentials", "Choose cloud primitives by workload, failure domain, operational effort, and cost.", 6, [
        { heading: "Separate responsibilities", body: ["Cloud providers operate the underlying service, but you still own configuration, identity, data protection, and application behavior."] },
        { heading: "Design for regions and zones", body: ["Use zones for routine fault isolation and multiple regions when recovery objectives justify replication complexity."] },
        { heading: "Prefer managed services carefully", body: ["Managed components reduce undifferentiated operations, but evaluate lock-in, limits, portability, and unit economics before committing."] },
      ]),
    ],
  },
  performance: {
    topics: ["Tail Latency", "Profiling", "Query Optimization"],
    articles: [
      a("performance-engineering", "Performance Engineering", "Turn latency complaints into measurable budgets and targeted improvements.", 6, [
        { heading: "Measure the tail", body: ["P95 and P99 latency reveal queueing and slow dependencies that averages hide. Track them by endpoint, tenant, and workload."] },
        { heading: "Optimize the critical path", body: ["Remove unnecessary round trips, batch safe operations, cache stable reads, and move nonessential work off the request path."] },
        { heading: "Verify under load", body: ["Use representative traffic, realistic data volume, warm and cold paths, and regression thresholds in CI or pre-production."] },
      ]),
    ],
  },
  cost: {
    topics: ["Unit Economics", "FinOps", "Storage Lifecycle"],
    articles: [
      a("cost-aware-architecture", "Cost-Aware Architecture", "Control cloud spend by connecting resource choices to business units and workload behavior.", 5, [
        { heading: "Track a unit cost", body: ["Measure cost per request, active user, transaction, or GB processed so architecture decisions can be compared against value."] },
        { heading: "Remove waste first", body: ["Right-size idle resources, use schedules, set retention policies, and select storage tiers based on access patterns."] },
        { heading: "Balance cost and resilience", body: ["Cheap infrastructure that causes downtime or slow recovery is not cheaper. Make reliability and performance trade-offs explicit."] },
      ]),
    ],
  },
  observability: {
    topics: ["Distributed Tracing", "SLOs", "Alert Design"],
    articles: [
      a("observability-fundamentals", "Observability Fundamentals", "Build telemetry that explains user impact and helps teams act during incidents.", 5, [
        { heading: "Use three signals", body: ["Metrics show trends, logs explain events, and traces connect a request across services. Correlation IDs make them useful together."] },
        { heading: "Alert on symptoms", body: ["Alert on SLO burn, error rate, latency, and saturation rather than every low-level fluctuation."] },
        { heading: "Keep telemetry safe", body: ["Redact secrets and personal data, control cardinality, and set retention based on investigation value and cost."] },
      ]),
    ],
  },
  interview: {
    topics: ["Requirement Clarification", "Trade-off Narratives", "Design Communication"],
    articles: [
      a("system-design-interview-method", "A Repeatable Interview Method", "A clear sequence for moving from ambiguous requirements to a defensible architecture.", 6, [
        { heading: "Clarify the problem", body: ["Confirm users, core actions, scale, latency, availability, consistency, and what is explicitly out of scope."] },
        { heading: "Explain the shape", body: ["Start with a simple high-level design, then zoom into the riskiest flow and calculate the capacity that drives your choices."] },
        { heading: "Close with trade-offs", body: ["Name alternatives, bottlenecks, failure modes, operational costs, and the next test you would run in a real system."] },
      ]),
    ],
  },
  databases: {
    topics: ["Indexing", "Transactions", "Replication"],
    articles: [
      a("database-selection-guide", "Choosing a Database", "Match data shape, consistency, access patterns, and operational constraints to a storage model.", 6, [
        { heading: "Start with access patterns", body: ["List reads, writes, query shapes, transaction boundaries, retention, and expected growth before choosing a database."] },
        { heading: "Know the trade-offs", body: ["Relational systems provide mature transactions and constraints; key-value, document, and wide-column stores trade query flexibility for scale or access-pattern alignment."] },
        { heading: "Plan operations", body: ["Include backups, migrations, replicas, failover, indexes, capacity limits, and recovery testing in the initial design."] },
      ]),
    ],
  },
  "distributed-systems": {
    topics: ["Consensus", "Consistency Models", "Idempotency"],
    articles: [
      a("distributed-systems-reality", "The Reality of Distributed Systems", "Reason about partial failure, time, ordering, and consistency across machines.", 7, [
        { heading: "Networks fail partially", body: ["A caller can time out while the server completes the request. Design request IDs, idempotency keys, and reconciliation paths."] },
        { heading: "Choose consistency intentionally", body: ["Strong consistency simplifies correctness but can increase latency and coordination. Eventual consistency needs conflict and stale-read handling."] },
        { heading: "Make time explicit", body: ["Do not assume clocks agree or messages arrive in order. Use versions, deadlines, sequence numbers, and causal metadata where needed."] },
      ]),
    ],
  },
  templates: {
    topics: ["Reference Architectures", "Decision Records", "Production Checklists"],
    articles: [
      a("using-architecture-templates", "Using Architecture Templates", "Adapt a reference architecture to constraints instead of copying it blindly.", 5, [
        { heading: "Begin with constraints", body: ["Record traffic, team skills, compliance, budget, latency, availability, and deployment requirements before selecting a template."] },
        { heading: "Mark the boundaries", body: ["Separate template defaults from decisions that must change for your domain, data sensitivity, or failure model."] },
        { heading: "Turn it into a plan", body: ["Add owners, risks, migrations, observability, security controls, and a validation checklist to make the template actionable."] },
      ]),
    ],
  },
  comparisons: {
    topics: ["Decision Matrices", "Trade-off Analysis", "Migration Paths"],
    articles: [
      a("architecture-tradeoffs", "Making Architecture Trade-offs", "Compare options with explicit criteria rather than relying on popularity or intuition.", 5, [
        { heading: "Define criteria", body: ["Score options against scale, reliability, latency, cost, team capability, security, and time to deliver."] },
        { heading: "Compare failure modes", body: ["For every option, ask how it behaves during dependency loss, overload, bad deploys, data corruption, and regional failure."] },
        { heading: "Document the decision", body: ["Capture context, rejected alternatives, assumptions, and the signal that would cause you to revisit the choice."] },
      ]),
    ],
  },
  capacity: {
    topics: ["Peak Traffic", "Growth Forecasts", "Queue Capacity"],
    articles: [
      a("capacity-modeling", "Capacity Modeling", "Translate product growth and workload behavior into resources, limits, and headroom.", 6, [
        { heading: "Model the workload", body: ["Estimate average and peak requests, payload size, concurrency, storage growth, and read/write ratios."] },
        { heading: "Add headroom", body: ["Plan for bursts, failover capacity, deploys, and forecast error. A system at 100% utilization has no recovery room."] },
        { heading: "Validate assumptions", body: ["Compare estimates with production telemetry and load tests. Update the model when traffic mix or feature behavior changes."] },
      ]),
    ],
  },
};

export const KNOWLEDGE: KnowledgeCategory[] = KNOWLEDGE_BASE.map((category) => {
  const expansion = KNOWLEDGE_EXPANSIONS[category.id];
  return expansion
    ? { ...category, topics: [...category.topics, ...expansion.topics], articles: [...category.articles, ...expansion.articles] }
    : category;
});

export const ALL_ARTICLES: Article[] = KNOWLEDGE.flatMap((c) => c.articles);

export const findArticle = (slug: string) => ALL_ARTICLES.find((art) => art.slug === slug);

export const RECOMMENDED_LEARNING_ORDER = ["Architecture Basics", "Scalability", "Databases", "Caching", "Load Balancing", "Distributed Systems", "Reliability", "Performance", "Security", "Messaging/Event-Driven Systems", "Cloud", "Observability", "Cost Optimization", "Architecture Comparisons", "Interview Problems"];
