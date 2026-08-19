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

export const ALL_ARTICLES: Article[] = KNOWLEDGE.flatMap((c) => c.articles);

export const findArticle = (slug: string) => ALL_ARTICLES.find((art) => art.slug === slug);