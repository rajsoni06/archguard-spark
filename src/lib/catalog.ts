import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Archive,
  BarChart3,
  Boxes,
  Cloud,
  Container,
  Cpu,
  Database,
  FileKey,
  Gauge,
  Globe,
  HardDrive,
  Key,
  Layers,
  Lock,
  MessageSquare,
  Network,
  Radio,
  Route,
  Scale,
  Server,
  Shield,
  ShieldCheck,
  Signal,
  Split,
  Timer,
  Users,
  Waves,
  Workflow,
  Zap,
} from "lucide-react";

export type CloudId = "aws" | "azure" | "gcp";

/** Capability tags consumed by the deterministic rule engine. */
export type Capability =
  | "client"
  | "dns"
  | "cdn"
  | "waf"
  | "load-balancer"
  | "api-gateway"
  | "compute"
  | "container"
  | "serverless"
  | "autoscaling"
  | "cache"
  | "database"
  | "managed-database"
  | "nosql"
  | "object-storage"
  | "block-storage"
  | "archive"
  | "queue"
  | "pubsub"
  | "streaming"
  | "auth"
  | "secrets"
  | "encryption"
  | "network"
  | "private-network"
  | "monitoring"
  | "tracing";

export interface ServiceDef {
  id: string;
  name: string;
  category: string;
  icon: LucideIcon;
  caps: Capability[];
  note?: string;
}

export interface CloudDef {
  id: CloudId;
  name: string;
  short: string;
  colorVar: string;
  categories: { name: string; services: ServiceDef[] }[];
}

const s = (
  id: string,
  name: string,
  category: string,
  icon: LucideIcon,
  caps: Capability[],
): ServiceDef => ({ id, name, category, icon, caps });

export const CLOUDS: Record<CloudId, CloudDef> = {
  aws: {
    id: "aws",
    name: "Amazon Web Services",
    short: "AWS",
    colorVar: "var(--aws)",
    categories: [
      {
        name: "Compute",
        services: [
          s("ec2", "EC2", "Compute", Server, ["compute"]),
          s("lambda", "Lambda", "Compute", Zap, ["serverless", "compute"]),
          s("ecs", "ECS", "Compute", Container, ["container", "compute"]),
          s("eks", "EKS", "Compute", Boxes, ["container", "compute"]),
          s("fargate", "Fargate", "Compute", Cpu, ["container", "compute"]),
          s("asg", "Auto Scaling", "Compute", Scale, ["autoscaling"]),
        ],
      },
      {
        name: "Storage",
        services: [
          s("s3", "S3", "Storage", Archive, ["object-storage"]),
          s("ebs", "EBS", "Storage", HardDrive, ["block-storage"]),
          s("efs", "EFS", "Storage", HardDrive, ["block-storage"]),
          s("glacier", "Glacier", "Storage", Archive, ["archive"]),
        ],
      },
      {
        name: "Database",
        services: [
          s("rds", "RDS", "Database", Database, ["database", "managed-database"]),
          s("aurora", "Aurora", "Database", Database, ["database", "managed-database"]),
          s("dynamodb", "DynamoDB", "Database", Layers, ["database", "nosql"]),
          s("elasticache", "ElastiCache", "Database", Gauge, ["cache"]),
          s("documentdb", "DocumentDB", "Database", Layers, ["database", "nosql"]),
        ],
      },
      {
        name: "Networking",
        services: [
          s("vpc", "VPC", "Networking", Network, ["network", "private-network"]),
          s("subnet", "Subnet", "Networking", Split, ["network"]),
          s("route53", "Route 53", "Networking", Route, ["dns"]),
          s("cloudfront", "CloudFront", "Networking", Globe, ["cdn"]),
          s("apigw", "API Gateway", "Networking", Workflow, ["api-gateway"]),
          s("alb", "Application Load Balancer", "Networking", Scale, ["load-balancer"]),
          s("nat", "NAT Gateway", "Networking", Network, ["network"]),
        ],
      },
      {
        name: "Security",
        services: [
          s("iam", "IAM", "Security", ShieldCheck, ["auth"]),
          s("cognito", "Cognito", "Security", Users, ["auth"]),
          s("waf", "WAF", "Security", Shield, ["waf"]),
          s("kms", "KMS", "Security", Key, ["encryption"]),
          s("secrets", "Secrets Manager", "Security", FileKey, ["secrets"]),
          s("sg", "Security Groups", "Security", Lock, ["private-network"]),
        ],
      },
      {
        name: "Messaging",
        services: [
          s("sqs", "SQS", "Messaging", MessageSquare, ["queue"]),
          s("sns", "SNS", "Messaging", Radio, ["pubsub"]),
          s("eventbridge", "EventBridge", "Messaging", Workflow, ["pubsub"]),
          s("kinesis", "Kinesis", "Messaging", Waves, ["streaming"]),
          s("msk", "MSK", "Messaging", Waves, ["streaming"]),
        ],
      },
      {
        name: "Monitoring",
        services: [
          s("cloudwatch", "CloudWatch", "Monitoring", BarChart3, ["monitoring"]),
          s("xray", "X-Ray", "Monitoring", Activity, ["tracing"]),
        ],
      },
      {
        name: "Clients",
        services: [
          s("users", "Users", "Clients", Users, ["client"]),
          s("mobile", "Mobile App", "Clients", Signal, ["client"]),
        ],
      },
    ],
  },
  azure: {
    id: "azure",
    name: "Microsoft Azure",
    short: "Azure",
    colorVar: "var(--azure)",
    categories: [
      {
        name: "Compute",
        services: [
          s("vm", "Virtual Machines", "Compute", Server, ["compute"]),
          s("functions", "Functions", "Compute", Zap, ["serverless", "compute"]),
          s("appservice", "App Service", "Compute", Cloud, ["compute"]),
          s("aks", "AKS", "Compute", Boxes, ["container", "compute"]),
          s("aci", "Container Instances", "Compute", Container, ["container", "compute"]),
          s("vmss", "VM Scale Sets", "Compute", Scale, ["autoscaling"]),
        ],
      },
      {
        name: "Storage",
        services: [
          s("blob", "Blob Storage", "Storage", Archive, ["object-storage"]),
          s("disk", "Managed Disks", "Storage", HardDrive, ["block-storage"]),
          s("files", "Azure Files", "Storage", HardDrive, ["block-storage"]),
          s("archive-tier", "Archive Storage", "Storage", Archive, ["archive"]),
        ],
      },
      {
        name: "Database",
        services: [
          s("sqldb", "Azure SQL", "Database", Database, ["database", "managed-database"]),
          s("pgflex", "PostgreSQL Flexible", "Database", Database, [
            "database",
            "managed-database",
          ]),
          s("cosmos", "Cosmos DB", "Database", Layers, ["database", "nosql"]),
          s("rediscache", "Azure Cache for Redis", "Database", Gauge, ["cache"]),
        ],
      },
      {
        name: "Networking",
        services: [
          s("vnet", "Virtual Network", "Networking", Network, ["network", "private-network"]),
          s("subnet", "Subnet", "Networking", Split, ["network"]),
          s("dns", "Azure DNS", "Networking", Route, ["dns"]),
          s("cdn", "Azure CDN", "Networking", Globe, ["cdn"]),
          s("apim", "API Management", "Networking", Workflow, ["api-gateway"]),
          s("appgw", "Application Gateway", "Networking", Scale, ["load-balancer", "waf"]),
          s("frontdoor", "Front Door", "Networking", Globe, ["cdn", "load-balancer"]),
        ],
      },
      {
        name: "Security",
        services: [
          s("entra", "Entra ID", "Security", ShieldCheck, ["auth"]),
          s("waf", "Azure WAF", "Security", Shield, ["waf"]),
          s("keyvault", "Key Vault", "Security", FileKey, ["secrets", "encryption"]),
          s("nsg", "Network Security Group", "Security", Lock, ["private-network"]),
          s("defender", "Defender for Cloud", "Security", Shield, ["monitoring"]),
        ],
      },
      {
        name: "Messaging",
        services: [
          s("servicebus", "Service Bus", "Messaging", MessageSquare, ["queue"]),
          s("eventgrid", "Event Grid", "Messaging", Radio, ["pubsub"]),
          s("eventhubs", "Event Hubs", "Messaging", Waves, ["streaming"]),
          s("queuestorage", "Queue Storage", "Messaging", MessageSquare, ["queue"]),
        ],
      },
      {
        name: "Monitoring",
        services: [
          s("monitor", "Azure Monitor", "Monitoring", BarChart3, ["monitoring"]),
          s("appinsights", "Application Insights", "Monitoring", Activity, ["tracing"]),
        ],
      },
      {
        name: "Clients",
        services: [
          s("users", "Users", "Clients", Users, ["client"]),
          s("mobile", "Mobile App", "Clients", Signal, ["client"]),
        ],
      },
    ],
  },
  gcp: {
    id: "gcp",
    name: "Google Cloud Platform",
    short: "GCP",
    colorVar: "var(--gcp)",
    categories: [
      {
        name: "Compute",
        services: [
          s("gce", "Compute Engine", "Compute", Server, ["compute"]),
          s("cloudfunctions", "Cloud Functions", "Compute", Zap, ["serverless", "compute"]),
          s("cloudrun", "Cloud Run", "Compute", Container, ["container", "compute"]),
          s("gke", "GKE", "Compute", Boxes, ["container", "compute"]),
          s("appengine", "App Engine", "Compute", Cloud, ["compute"]),
          s("mig", "Managed Instance Group", "Compute", Scale, ["autoscaling"]),
        ],
      },
      {
        name: "Storage",
        services: [
          s("gcs", "Cloud Storage", "Storage", Archive, ["object-storage"]),
          s("pd", "Persistent Disk", "Storage", HardDrive, ["block-storage"]),
          s("filestore", "Filestore", "Storage", HardDrive, ["block-storage"]),
          s("coldline", "Coldline Archive", "Storage", Archive, ["archive"]),
        ],
      },
      {
        name: "Database",
        services: [
          s("cloudsql", "Cloud SQL", "Database", Database, ["database", "managed-database"]),
          s("spanner", "Spanner", "Database", Database, ["database", "managed-database"]),
          s("firestore", "Firestore", "Database", Layers, ["database", "nosql"]),
          s("bigtable", "Bigtable", "Database", Layers, ["database", "nosql"]),
          s("memorystore", "Memorystore", "Database", Gauge, ["cache"]),
        ],
      },
      {
        name: "Networking",
        services: [
          s("vpc", "VPC", "Networking", Network, ["network", "private-network"]),
          s("subnet", "Subnet", "Networking", Split, ["network"]),
          s("clouddns", "Cloud DNS", "Networking", Route, ["dns"]),
          s("cdn", "Cloud CDN", "Networking", Globe, ["cdn"]),
          s("apigee", "Apigee API Gateway", "Networking", Workflow, ["api-gateway"]),
          s("clb", "Cloud Load Balancing", "Networking", Scale, ["load-balancer"]),
          s("natgw", "Cloud NAT", "Networking", Network, ["network"]),
        ],
      },
      {
        name: "Security",
        services: [
          s("iam", "Cloud IAM", "Security", ShieldCheck, ["auth"]),
          s("identityplatform", "Identity Platform", "Security", Users, ["auth"]),
          s("armor", "Cloud Armor", "Security", Shield, ["waf"]),
          s("kms", "Cloud KMS", "Security", Key, ["encryption"]),
          s("secretmanager", "Secret Manager", "Security", FileKey, ["secrets"]),
          s("firewall", "VPC Firewall", "Security", Lock, ["private-network"]),
        ],
      },
      {
        name: "Messaging",
        services: [
          s("pubsub", "Pub/Sub", "Messaging", Radio, ["pubsub", "queue"]),
          s("tasks", "Cloud Tasks", "Messaging", Timer, ["queue"]),
          s("dataflow", "Dataflow", "Messaging", Waves, ["streaming"]),
        ],
      },
      {
        name: "Monitoring",
        services: [
          s("monitoring", "Cloud Monitoring", "Monitoring", BarChart3, ["monitoring"]),
          s("trace", "Cloud Trace", "Monitoring", Activity, ["tracing"]),
        ],
      },
      {
        name: "Clients",
        services: [
          s("users", "Users", "Clients", Users, ["client"]),
          s("mobile", "Mobile App", "Clients", Signal, ["client"]),
        ],
      },
    ],
  },
};

export function findService(cloud: CloudId, serviceId: string): ServiceDef | undefined {
  for (const cat of CLOUDS[cloud].categories) {
    const hit = cat.services.find((svc) => svc.id === serviceId);
    if (hit) return hit;
  }
  return undefined;
}

export const BOUNDARY_KINDS = [
  { id: "region", label: "Region", color: "var(--info)" },
  { id: "vpc", label: "VPC", color: "var(--primary)" },
  { id: "az", label: "Availability Zone", color: "var(--muted-foreground)" },
  { id: "public-subnet", label: "Public Subnet", color: "var(--warning)" },
  { id: "private-subnet", label: "Private Subnet", color: "var(--success)" },
  { id: "k8s", label: "Kubernetes Cluster", color: "var(--info)" },
  { id: "service-group", label: "Service Group", color: "var(--primary)" },
  { id: "database-layer", label: "Database Layer", color: "var(--success)" },
  { id: "security-boundary", label: "Security Boundary", color: "var(--destructive)" },
] as const;

export type BoundaryKind = (typeof BOUNDARY_KINDS)[number]["id"];

export const ARCHITECTURE_PATTERNS = [
  "Monolithic",
  "Layered (N-Tier)",
  "Microservices",
  "Event-Driven",
  "Serverless",
  "CQRS",
  "Distributed System",
];

export const SCALES = ["1K Users", "10K Users", "100K Users", "1M+ Users", "10M+ Users"];

export const INDUSTRIES = [
  "E-Commerce",
  "Banking",
  "Healthcare",
  "Education",
  "Gaming",
  "Social Media",
  "Enterprise SaaS",
  "Government",
];

export const PRIORITIES = [
  "Security",
  "Scalability",
  "Availability",
  "Performance",
  "Cost Optimization",
  "Simplicity",
];