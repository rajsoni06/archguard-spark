export interface PageMeta {
  title: string;
  description: string;
  heading: string;
  subtitle: string;
  items: { title: string; detail: string; badge?: string }[];
}

export const PAGE_META: Record<string, PageMeta> = {
  projects: {
    title: "My Projects — ArchGuard AI",
    description:
      "All of your cloud architecture projects, their maturity level and their latest deterministic review score.",
    heading: "My Projects",
    subtitle: "Every architecture you own, with its last rule-engine score",
    items: [
      { title: "E-Commerce Platform Architecture", detail: "AWS • Microservices • 10M+ Users", badge: "87 / 100" },
      { title: "Retail Banking Core", detail: "Azure • Layered • 1M+ Users", badge: "74 / 100" },
      { title: "Telemetry Ingestion Pipeline", detail: "GCP • Event-Driven • 10M+ Users", badge: "91 / 100" },
      { title: "Internal Admin Console", detail: "AWS • Monolithic • 10K Users", badge: "58 / 100" },
    ],
  },
  history: {
    title: "Review History — ArchGuard AI",
    description:
      "A deterministic audit trail of every architecture review, its score movement and the rules that changed.",
    heading: "Review History",
    subtitle: "Deterministic reviews are reproducible — the same graph always scores the same",
    items: [
      { title: "E-Commerce Platform · v14", detail: "Added WAF and read replica", badge: "+9" },
      { title: "E-Commerce Platform · v13", detail: "Moved RDS into private subnet", badge: "+12" },
      { title: "Banking Core · v6", detail: "Secrets Manager introduced", badge: "+6" },
      { title: "Telemetry Pipeline · v3", detail: "Removed duplicate gateway", badge: "+2" },
    ],
  },
  templates: {
    title: "Architecture Templates — ArchGuard AI",
    description:
      "Start from a reviewed reference architecture for microservices, serverless, event-driven and regulated workloads.",
    heading: "Templates",
    subtitle: "Reference architectures that already satisfy the core rule set",
    items: [
      { title: "Three-Tier Web Application", detail: "ALB → ECS → RDS Multi-AZ → S3", badge: "AWS" },
      { title: "Event-Driven Microservices", detail: "API Gateway → Services → SQS/SNS → DynamoDB", badge: "AWS" },
      { title: "Serverless API", detail: "Front Door → Functions → Cosmos DB", badge: "Azure" },
      { title: "Streaming Analytics", detail: "Pub/Sub → Dataflow → Bigtable → Cloud Storage", badge: "GCP" },
    ],
  },
  reports: {
    title: "Architecture Reports — ArchGuard AI",
    description:
      "Professional architecture review reports combining rule-engine findings with plain-language explanations.",
    heading: "Reports",
    subtitle: "Exportable review documents generated from rule-engine findings",
    items: [
      { title: "E-Commerce Platform — Full Review", detail: "PDF · 14 pages · generated from v14", badge: "PDF" },
      { title: "Banking Core — Compliance Summary", detail: "PCI DSS, SOC 2, ISO 27001 checklist", badge: "PDF" },
      { title: "Telemetry Pipeline — Diagram Export", detail: "High-resolution canvas snapshot", badge: "PNG" },
    ],
  },
  team: {
    title: "Team Collaboration — ArchGuard AI",
    description:
      "Share architectures with reviewers, assign findings and track who resolved which rule violation.",
    heading: "Team Collaboration",
    subtitle: "Shared reviews, assigned findings and reviewer sign-off",
    items: [
      { title: "Platform Team", detail: "6 members · owns 4 architectures", badge: "Owner" },
      { title: "Security Review Board", detail: "3 members · sign-off required for Banking", badge: "Reviewer" },
      { title: "Cloud Enablement", detail: "9 members · template maintainers", badge: "Editor" },
    ],
  },
  settings: {
    title: "Settings — ArchGuard AI",
    description:
      "Configure default cloud provider, rule severity thresholds, compliance frameworks and export preferences.",
    heading: "Settings",
    subtitle: "Defaults, rule thresholds and export preferences",
    items: [
      { title: "Default cloud provider", detail: "Applied to every new project", badge: "AWS" },
      { title: "Compliance frameworks", detail: "Checked during every review", badge: "PCI DSS · SOC 2 · GDPR" },
      { title: "Minimum passing score", detail: "Below this a review is marked failing", badge: "75" },
      { title: "Explanation detail", detail: "How verbose generated explanations are", badge: "Standard" },
    ],
  },
};