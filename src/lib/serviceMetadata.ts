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
    description: `${subject} is a managed data service for its supported database or caching workload.`,
    whyUse: `${subject} provides managed data storage and operational capabilities for applications with its supported access patterns.`,
    goodFor: ["Application data storage", "Managed backups and availability", "Production workloads matching its data model"],
    notIdealFor: ["Access patterns outside its data model", "Replacing an analytics warehouse with transactional storage", "Teams needing complete engine-level control"],
    alternatives: ["Cloud SQL", "Spanner", "Firestore", "BigQuery"],
    tradeOffs: ["Data-model choices affect scaling and query flexibility", "Managed features add recurring usage cost", "Migration can require provider-specific APIs"],
  };
  return {
    description: `${subject} is a managed ${svc.category.toLowerCase()} service for cloud architectures.`,
    whyUse: `${subject} provides managed ${svc.category.toLowerCase()} capabilities so teams can focus on the workload instead of equivalent infrastructure operations.`,
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
