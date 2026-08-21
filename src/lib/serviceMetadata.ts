import type { ServiceDef } from "@/lib/catalog";

export interface ServiceDecisionMetadata {
  description: string;
  whyUse: string;
  goodFor: string[];
  notIdealFor: string[];
  alternatives: string[];
  tradeOffs: string[];
}

type MetadataOverrides = Record<string, ServiceDecisionMetadata>;

const metadata: MetadataOverrides = {
  kinesis: {
    description: "Managed real-time streaming service for collecting, processing, and delivering continuously generated data at scale.",
    whyUse: "Kinesis lets applications ingest and process events continuously with managed streams, reducing the need to operate custom streaming infrastructure.",
    goodFor: ["Real-time event and log ingestion", "Streaming analytics and dashboards", "Clickstream and telemetry processing", "Building event-driven data pipelines"],
    notIdealFor: ["Simple request-response APIs", "Small batch datasets with no real-time requirement", "Workloads needing a relational query model or unrestricted broker-level control"],
    alternatives: ["Amazon Managed Streaming for Apache Kafka (MSK)", "Amazon SQS or SNS for simpler messaging", "Azure Event Hubs", "Google Cloud Pub/Sub", "Self-managed Apache Kafka"],
    tradeOffs: ["Managed scaling reduces operations but stream shards and throughput still require capacity planning", "Retention, ingestion, processing, and downstream delivery can create usage-based costs", "Partitioning, ordering, replay, and consumer-lag behavior require deliberate stream design", "AWS-specific integrations can increase provider lock-in"],
  },
  vertexai: {
    description: "Managed platform for building, training, deploying, and governing machine learning and generative AI applications.",
    whyUse: "Vertex AI unifies model development, training, evaluation, deployment, and MLOps in one Google Cloud platform.",
    goodFor: ["Training and deploying ML models", "Generative AI applications", "Model evaluation and experimentation", "MLOps and model lifecycle management", "Using and customizing foundation models"],
    notIdealFor: ["Simple deterministic application logic", "Basic web or API workloads without AI/ML", "Small inference tasks covered by a simpler managed AI API"],
    alternatives: ["Amazon SageMaker", "Azure Machine Learning", "Google Cloud AI APIs", "Self-managed ML infrastructure"],
    tradeOffs: ["Broad managed capabilities add platform complexity", "Training, inference, compute, and storage usage can vary costs significantly", "Managed features deepen dependency on the Google Cloud ecosystem"],
  },
  gce: {
    description: "Configurable virtual machines for running applications with control over the operating system, machine shape, and network.",
    whyUse: "Compute Engine provides flexible virtual machines when you need control over the OS, runtime, networking, or attached infrastructure.",
    goodFor: ["Lift-and-shift migrations", "Legacy applications", "Custom OS or runtime requirements", "GPU and high-performance compute workloads"],
    notIdealFor: ["Teams avoiding OS patching", "Short event handlers", "Highly variable workloads better suited to serverless compute"],
    alternatives: ["Cloud Run", "GKE", "App Engine", "Managed Instance Groups"],
    tradeOffs: ["You own guest OS patching and hardening", "VM capacity can cost money while idle", "Flexible configuration increases operational responsibility"],
  },
  cloudrun: {
    description: "Fully managed serverless platform for deploying containerized applications that scale with incoming requests.",
    whyUse: "Cloud Run runs stateless containers without cluster management and scales capacity down when the service is idle.",
    goodFor: ["HTTP APIs and web services", "Containerized microservices", "Event-driven workers", "Variable traffic workloads"],
    notIdealFor: ["Workloads needing privileged host access", "Long-lived stateful services", "Complex Kubernetes scheduling or networking requirements"],
    alternatives: ["Cloud Functions", "GKE", "App Engine", "Compute Engine"],
    tradeOffs: ["Container and request limits constrain some workloads", "Cold starts can affect latency when scaling from zero", "Runtime integration remains tied to Google Cloud"],
  },
  cloudfunctions: {
    description: "Event-driven serverless functions for small pieces of code that run in response to events or HTTP requests.",
    whyUse: "Cloud Functions removes server management for focused handlers that react to events or serve lightweight endpoints.",
    goodFor: ["Event processing", "Scheduled jobs", "Webhook handlers", "Lightweight APIs and automation"],
    notIdealFor: ["Long-running or GPU workloads", "Complex multi-service applications", "Workloads requiring consistently warm low latency"],
    alternatives: ["Cloud Run", "Workflows", "Compute Engine", "GKE"],
    tradeOffs: ["Cold starts can affect response latency", "Execution and concurrency limits shape application design", "Per-invocation pricing is less predictable for steady high traffic"],
  },
  gke: {
    description: "Managed Kubernetes platform for orchestrating containerized workloads across a cluster.",
    whyUse: "GKE provides Kubernetes control-plane management while retaining Kubernetes APIs, scheduling, and ecosystem flexibility.",
    goodFor: ["Large microservice platforms", "Multi-team container operations", "Custom scheduling and networking", "Portable Kubernetes workloads"],
    notIdealFor: ["Small applications with a few services", "Teams without Kubernetes operating experience", "Simple stateless APIs"],
    alternatives: ["Cloud Run", "App Engine", "Compute Engine", "Amazon EKS or Azure AKS"],
    tradeOffs: ["Kubernetes adds significant operational and learning overhead", "Cluster capacity and add-ons require cost management", "Portability can still be reduced by cloud-specific integrations"],
  },
  cloudsql: {
    description: "Fully managed relational database service for MySQL, PostgreSQL, and SQL Server workloads.",
    whyUse: "Cloud SQL provides familiar relational engines with managed backups, patching, replication, and high-availability options.",
    goodFor: ["Transactional application databases", "User accounts and billing", "Structured relational data", "Applications using standard SQL engines"],
    notIdealFor: ["Globally distributed writes at very large scale", "Document or key-value access patterns", "Analytics over very large datasets"],
    alternatives: ["AlloyDB", "Spanner", "Firestore", "BigQuery for analytics"],
    tradeOffs: ["Vertical write scaling can become a ceiling", "High availability and read replicas add cost and operational choices", "Managed relational features remain coupled to supported engines and regions"],
  },
  gcs: {
    description: "Durable object storage for unstructured data, files, backups, and data-lake workloads.",
    whyUse: "Cloud Storage offers highly durable, scalable blob storage with lifecycle, access-control, and archival tiers.",
    goodFor: ["User uploads and media", "Backups and exports", "Static assets", "Data lake foundations"],
    notIdealFor: ["Low-latency transactional rows", "POSIX shared filesystem semantics", "Frequent small random updates"],
    alternatives: ["Filestore", "Persistent Disk", "Firestore", "BigQuery"],
    tradeOffs: ["Object access has higher latency than local or block storage", "Request, retrieval, and egress charges need lifecycle planning", "Applications must work with object semantics rather than filesystem semantics"],
  },
  bigquery: {
    description: "Serverless analytical data warehouse for large-scale SQL queries and reporting.",
    whyUse: "BigQuery separates analytical storage and compute so teams can query large datasets without managing warehouse servers.",
    goodFor: ["Business intelligence", "Ad-hoc SQL analytics", "Data warehouse workloads", "Large-scale event and log analysis"],
    notIdealFor: ["Low-latency OLTP transactions", "Frequent single-row updates", "Small applications needing a simple relational database"],
    alternatives: ["Redshift", "Azure Synapse Analytics", "Databricks SQL", "Cloud SQL for transactional data"],
    tradeOffs: ["Query and storage costs require partitioning and workload governance", "Interactive performance depends on query and table design", "Warehouse-specific SQL and APIs can increase migration effort"],
  },
  clb: {
    description: "Managed regional and global load balancing for distributing traffic across healthy backends.",
    whyUse: "Cloud Load Balancing improves availability and routes client traffic to suitable healthy backends across regions or zones.",
    goodFor: ["Multi-instance applications", "Global HTTP(S) traffic", "TLS termination", "Health-based failover"],
    notIdealFor: ["Single-instance prototypes", "Direct service-to-service calls", "Traffic that does not need distribution or failover"],
    alternatives: ["Cloud CDN", "Apigee", "DNS-based routing", "Self-managed Envoy or NGINX"],
    tradeOffs: ["Configuration and routing rules add complexity", "Per-rule, forwarding, and egress costs need review", "Provider-specific health checks and routing behavior affect portability"],
  },
  armor: {
    description: "Google Cloud web application firewall and edge protection service for internet-facing workloads.",
    whyUse: "Cloud Armor filters malicious HTTP(S) traffic and helps protect applications from common web attacks and abusive traffic.",
    goodFor: ["Public web applications", "API protection", "OWASP attack mitigation", "Policy-based edge filtering"],
    notIdealFor: ["Private services with no untrusted ingress", "Replacing secure application input validation", "Non-HTTP network controls"],
    alternatives: ["Cloud Load Balancing security policies", "Apigee policies", "AWS WAF", "Azure WAF"],
    tradeOffs: ["Rules require tuning to avoid false positives", "Protection does not replace application security testing", "Advanced policies add cost and Google Cloud edge dependency"],
  },
  secretmanager: {
    description: "Managed storage and controlled access for application secrets such as API keys, passwords, and certificates.",
    whyUse: "Secret Manager keeps sensitive values out of source code and provides versioning, access control, and auditability.",
    goodFor: ["Database credentials", "API keys and tokens", "Certificate material", "Runtime secret injection"],
    notIdealFor: ["High-volume application data", "Encryption key lifecycle management", "Replacing identity or authorization controls"],
    alternatives: ["Cloud KMS for cryptographic keys", "HashiCorp Vault", "Azure Key Vault", "AWS Secrets Manager"],
    tradeOffs: ["Applications must handle rotation and access failures", "Secret reads and replication can add latency or cost", "IAM configuration is critical to prevent overexposure"],
  },
  kms: {
    description: "Managed key management service for creating, storing, rotating, and controlling cryptographic keys.",
    whyUse: "Cloud KMS centralizes encryption-key governance and integrates with Google Cloud services and application cryptography.",
    goodFor: ["Customer-managed encryption", "Key rotation and lifecycle policies", "Separation of duties", "Auditable cryptographic access"],
    notIdealFor: ["Storing passwords or API tokens", "General secrets management", "Applications that do not need key ownership or audit controls"],
    alternatives: ["Secret Manager", "Cloud HSM", "HashiCorp Vault", "AWS KMS or Azure Key Vault"],
    tradeOffs: ["Key permissions and rotation require careful operations", "Crypto operations and HSM tiers can add cost", "Application integration creates provider-specific dependencies"],
  },
  iam: {
    description: "Google Cloud identity and access management for controlling who can access which resources and actions.",
    whyUse: "Cloud IAM applies least-privilege permissions to users, groups, service accounts, and workload identities.",
    goodFor: ["Service-to-service authorization", "Role-based access control", "Project and resource governance", "Auditable least-privilege policies"],
    notIdealFor: ["End-user authentication flows", "Storing application secrets", "Replacing network-level controls"],
    alternatives: ["Identity Platform for end users", "IAP for application access", "Cloud KMS for key control", "Azure Entra ID or AWS IAM"],
    tradeOffs: ["Policy inheritance can be difficult to reason about", "Overly broad roles create security risk", "Google-specific resource hierarchy affects portability"],
  },
};

function categoryMetadata(svc: ServiceDef): ServiceDecisionMetadata {
  const subject = svc.name;
  if (svc.category === "AI / ML") return {
    description: `${subject} provides a managed capability for building or integrating AI and machine learning into applications.`,
    whyUse: `${subject} provides a managed way to add AI/ML capabilities without operating the underlying model-serving infrastructure.`,
    goodFor: ["AI-enabled application features", "Model inference", "Experimentation and evaluation"],
    notIdealFor: ["Non-AI application logic", "Strictly deterministic business rules", "Workloads needing unsupported custom model infrastructure"],
    alternatives: ["Vertex AI", "Amazon SageMaker", "Azure Machine Learning", "Self-managed ML infrastructure"],
    tradeOffs: ["Model usage and serving costs vary with traffic", "Managed abstractions limit low-level control", "Provider APIs can increase platform dependency"],
  };
  if (svc.category === "Database") return {
    description: `${subject} stores and retrieves application data using a database model designed for a particular kind of workload.`,
    whyUse: `${subject} gives an application a managed place to store data without requiring the team to operate every database task from scratch.`,
    goodFor: ["Application data storage", "Managed backups and availability", "Production workloads matching its data model"],
    notIdealFor: ["Access patterns outside its data model", "Replacing an analytics warehouse with transactional storage", "Teams needing complete engine-level control"],
    alternatives: ["A relational database", "A NoSQL database", "A managed cache", "An analytics warehouse"],
    tradeOffs: ["Choosing the wrong data model can make queries and scaling difficult", "Managed features add recurring usage cost", "Moving data later may require provider-specific APIs or migration work"],
  };
  const guidance: Record<string, Omit<ServiceDecisionMetadata, "description" | "whyUse"> & { description: string; whyUse: string }> = {
    Compute: {
      description: `${subject} runs application code, services, or workloads in the cloud.`,
      whyUse: `Use ${subject} when you need computing capacity without buying and maintaining physical servers.`,
      goodFor: ["Web applications and APIs", "Background jobs and workers", "Scalable production workloads"],
      notIdealFor: ["Storing primary application data", "Workloads outside its runtime model", "Very small tasks that a simpler service can handle"],
      alternatives: ["A serverless function", "A managed container platform", "A virtual machine", "A managed Kubernetes service"],
      tradeOffs: ["Managed operation reduces maintenance but limits some low-level control", "Capacity and execution time affect cost", "The service's runtime limits shape application design"],
    },
    Networking: {
      description: `${subject} helps connect, route, protect, or distribute traffic between cloud resources and users.`,
      whyUse: `Use ${subject} to control how requests travel through the architecture and to improve reachability, availability, or security.`,
      goodFor: ["Connecting application components", "Routing user traffic", "Private networks and controlled access"],
      notIdealFor: ["Replacing application business logic", "Workloads that do not need network control", "A simple direct connection with no routing requirements"],
      alternatives: ["A load balancer", "An API gateway", "Private networking", "DNS-based routing"],
      tradeOffs: ["Routing rules add configuration complexity", "Traffic and egress can create extra costs", "Provider-specific networking can reduce portability"],
    },
    Storage: {
      description: `${subject} stores files, objects, disks, or other durable data for cloud applications.`,
      whyUse: `Use ${subject} when an application needs durable storage that can grow without managing physical disks yourself.`,
      goodFor: ["Files, uploads, backups, and exports", "Application assets", "Durable production storage"],
      notIdealFor: ["Low-latency transactional queries", "Storage semantics it does not support", "Temporary data that does not need durability"],
      alternatives: ["Object storage", "Block storage", "File storage", "A database"],
      tradeOffs: ["Access speed and data semantics vary by storage type", "Storage, request, retrieval, and egress charges need monitoring", "Lifecycle and backup policies must be designed deliberately"],
    },
    Integration: {
      description: `${subject} helps cloud services exchange messages, events, tasks, or workflow steps.`,
      whyUse: `Use ${subject} to connect components without making every service directly depend on the internal implementation of another service.`,
      goodFor: ["Asynchronous processing", "Event-driven architectures", "Reliable service-to-service communication"],
      notIdealFor: ["Simple in-process function calls", "Workloads needing immediate synchronous responses only", "Messages that do not need delivery or workflow coordination"],
      alternatives: ["A queue", "A pub/sub topic", "An event bus", "A direct API call"],
      tradeOffs: ["Asynchronous systems improve resilience but add delay and debugging complexity", "Delivery, retries, ordering, and duplicate messages must be handled", "Message volume and retention affect cost"],
    },
    "API & Application Integration": {
      description: `${subject} exposes, secures, transforms, or connects application APIs.`,
      whyUse: `Use ${subject} when clients or services need a controlled entry point for calling application capabilities.`,
      goodFor: ["Public and internal APIs", "Authentication and request policies", "Connecting clients to backend services"],
      notIdealFor: ["Large data transfers", "Internal calls that need no gateway features", "Workloads better served by events or batch processing"],
      alternatives: ["A load balancer", "A direct service endpoint", "A message queue", "A service mesh"],
      tradeOffs: ["Central policies simplify governance but add another network hop", "Requests, data transfer, and optional features affect cost", "Gateway-specific policies can increase lock-in"],
    },
    "Containers & Kubernetes": {
      description: `${subject} is a building block for packaging, scheduling, exposing, or scaling containerized applications.`,
      whyUse: `Use ${subject} when teams need repeatable container deployments and control over how workloads run together.`,
      goodFor: ["Microservices platforms", "Repeatable application deployments", "Workloads needing container orchestration"],
      notIdealFor: ["A small application with no container requirement", "Simple functions or static content", "Teams without the operational capacity for container platforms"],
      alternatives: ["A serverless container platform", "A virtual machine", "A serverless function", "A managed application platform"],
      tradeOffs: ["Containers improve consistency but add platform concepts to learn", "Clusters, nodes, and add-ons require cost and capacity management", "Kubernetes flexibility increases operational responsibility"],
    },
    Caching: {
      description: `${subject} keeps frequently used data closer to an application so it can be returned faster.`,
      whyUse: `Use ${subject} to reduce repeated database work and improve response time for data that can be safely reused.`,
      goodFor: ["Frequently read data", "Session or short-lived data", "Reducing database load and latency"],
      notIdealFor: ["Data that must always be read directly from the source of truth", "Rarely accessed data", "Workloads without a clear invalidation strategy"],
      alternatives: ["A database read replica", "CDN caching", "Application in-memory caching", "No cache"],
      tradeOffs: ["Caching improves speed but can return stale data", "Eviction, expiration, and invalidation need clear rules", "Extra cache capacity and cache misses add cost and complexity"],
    },
    Security: {
      description: `${subject} helps authenticate users, authorize access, protect data, or defend cloud resources.`,
      whyUse: `Use ${subject} to apply security controls consistently instead of implementing the same protection separately in every application.`,
      goodFor: ["Identity and access control", "Protecting public applications and networks", "Secrets, encryption, and security monitoring"],
      notIdealFor: ["Replacing secure application code", "Controls outside its supported security boundary", "Treating one security service as complete protection"],
      alternatives: ["Application-level security controls", "A network security service", "A secrets manager", "A managed identity provider"],
      tradeOffs: ["Centralized controls improve consistency but require careful policy design", "Misconfiguration can block users or expose resources", "Security features and audit data can add cost"],
    },
    Monitoring: {
      description: `${subject} collects, searches, or alerts on application and infrastructure health information.`,
      whyUse: `Use ${subject} to understand whether a system is working, diagnose failures, and respond before users are seriously affected.`,
      goodFor: ["Logs, metrics, traces, and alerts", "Troubleshooting production incidents", "Service-level monitoring"],
      notIdealFor: ["Replacing application testing", "Collecting data without a question or retention plan", "Monitoring a component it cannot observe"],
      alternatives: ["Centralized logging", "Distributed tracing", "Application metrics", "A third-party observability platform"],
      tradeOffs: ["More telemetry improves visibility but increases storage and query cost", "Alerts need tuning to avoid noise", "Provider-specific dashboards and agents can increase lock-in"],
    },
    "CDN & Edge": {
      description: `${subject} serves content or routes requests closer to users at the edge of the network.`,
      whyUse: `Use ${subject} to reduce latency, absorb traffic spikes, and improve delivery of public content or applications.`,
      goodFor: ["Static assets and media", "Global web applications", "Edge caching and traffic acceleration"],
      notIdealFor: ["Private internal services", "Highly dynamic data that cannot be cached", "Replacing an application origin or database"],
      alternatives: ["A regional load balancer", "DNS routing", "An API gateway", "Direct origin access"],
      tradeOffs: ["Caching reduces origin load but requires invalidation rules", "Egress and request volume affect cost", "Edge behavior and provider integrations can reduce portability"],
    },
    "CDN & DNS": {
      description: `${subject} helps direct users to the right application endpoint and manage internet names or edge delivery.`,
      whyUse: `Use ${subject} when users need reliable name resolution or globally distributed access to an application.`,
      goodFor: ["Domain name management", "Traffic routing and failover", "Global application entry points"],
      notIdealFor: ["Internal application logic", "Persistent data storage", "Replacing health checks or application security"],
      alternatives: ["A CDN", "A load balancer", "Another DNS provider", "Private service discovery"],
      tradeOffs: ["DNS changes are cached and may not take effect immediately", "Global routing improves reach but adds configuration", "Domain and edge features can create provider dependency"],
    },
    DevOps: {
      description: `${subject} helps teams build, test, release, configure, or operate cloud applications.`,
      whyUse: `Use ${subject} to make software delivery repeatable and reduce manual deployment work.`,
      goodFor: ["Continuous integration and delivery", "Infrastructure as code", "Repeatable deployments and operations"],
      notIdealFor: ["Runtime application traffic", "One-off manual experiments", "Teams without source-control and release practices"],
      alternatives: ["A self-hosted CI/CD platform", "Manual deployment", "Infrastructure automation scripts", "Another cloud DevOps service"],
      tradeOffs: ["Automation improves repeatability but requires pipeline maintenance", "Build minutes, artifacts, and runners affect cost", "Provider-specific pipeline features can increase migration effort"],
    },
    Analytics: {
      description: `${subject} helps collect, transform, query, visualize, or learn from large amounts of data.`,
      whyUse: `Use ${subject} when the goal is to understand historical or streaming data rather than serve individual transactional requests.`,
      goodFor: ["Reports and dashboards", "Data pipelines and data lakes", "Large-scale analytical queries"],
      notIdealFor: ["Low-latency transactional writes", "Small datasets needing a simple database", "Workloads without a clear data-quality or governance plan"],
      alternatives: ["A relational database", "A NoSQL database", "A streaming platform", "A data warehouse or BI tool"],
      tradeOffs: ["Separating analytics from production systems protects application performance", "Data movement, storage, and query volume affect cost", "Pipelines require schema, quality, retention, and access governance"],
    },
    Migration: {
      description: `${subject} helps move applications, databases, or data into or between cloud environments.`,
      whyUse: `Use ${subject} to reduce the risk and manual effort involved in planning and executing a migration.`,
      goodFor: ["Cloud migrations", "Database and storage transfers", "Migration assessment and cutover planning"],
      notIdealFor: ["Normal application runtime traffic", "Small manual file copies", "Migrations without testing and rollback planning"],
      alternatives: ["Native replication", "Backup and restore", "Direct transfer tools", "A custom migration process"],
      tradeOffs: ["Migration tooling reduces effort but does not remove data validation work", "Transfer volume and downtime affect cost and schedule", "Source and target compatibility can limit automation"],
    },
    Clients: {
      description: `${subject} represents a user, device, or application that starts interactions with the architecture.`,
      whyUse: `Use ${subject} to make system entry points and user-facing dependencies visible in the architecture.`,
      goodFor: ["Showing system consumers", "Documenting web and mobile flows", "Clarifying external access paths"],
      notIdealFor: ["Backend processing", "Persistent data storage", "Representing internal infrastructure"],
      alternatives: ["A web client", "A mobile client", "An external API", "An internal service"],
      tradeOffs: ["Explicit clients clarify scope but may simplify real user behavior", "Different clients need different authentication and performance assumptions", "External dependencies introduce availability and security considerations"],
    },
  };
  const categoryGuide = guidance[svc.category];
  if (categoryGuide) return categoryGuide;
  return {
    description: `${subject} is a cloud component that provides a focused capability for ${svc.category.toLowerCase()} workloads.`,
    whyUse: `Use ${subject} when its focused capability matches a clear requirement in the architecture.`,
    goodFor: [`${svc.category} workloads`, "Production cloud architectures", "Teams that value managed operations"],
    notIdealFor: ["Workloads outside this service's purpose", "Requirements needing unsupported low-level control", "Very small workloads where a simpler component is sufficient"],
    alternatives: ["A comparable managed service in the same category", "A self-managed implementation when control is more important"],
    tradeOffs: ["Managed operation reduces maintenance but limits some customization", "Usage-based pricing requires monitoring", "Provider-specific integrations can increase lock-in"],
  };
}

export function getServiceDecisionMetadata(svc: ServiceDef): ServiceDecisionMetadata {
  // IDs are not globally unique across providers (for example `iam` and `kms`).
  // Only use an ID override when it is unambiguous; otherwise the service's
  // category-specific model is safer than showing another provider's copy.
  const ambiguousIds = new Set(["iam", "kms", "waf", "secrets", "datacatalog", "eventbus", "users", "mobile"]);
  return (!ambiguousIds.has(svc.id) && metadata[svc.id]) || categoryMetadata(svc);
}
