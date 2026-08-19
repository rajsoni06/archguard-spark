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
  iconUrl?: string;
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
        name: "Networking",
        services: [
          s("vpc", "VPC", "Networking", Network, ["network", "private-network"]),
          s("subnet", "Subnet", "Networking", Split, ["network"]),
          s("igw", "Internet Gateway", "Networking", Globe, ["network"]),
          s("nat", "NAT Gateway", "Networking", Network, ["network"]),
          s("alb", "ALB", "Networking", Scale, ["load-balancer"]),
          s("nlb", "NLB", "Networking", Scale, ["load-balancer"]),
          s("route53", "Route 53", "Networking", Route, ["dns"]),
          s("transit-gateway", "Transit Gateway", "Networking", Network, ["network"]),
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
          s("opensearch", "OpenSearch", "Database", Database, ["database"]),
          s("redshift", "Redshift", "Database", Database, ["database"]),
        ],
      },
      {
        name: "Integration",
        services: [
          s("apigw", "API Gateway", "Integration", Workflow, ["api-gateway"]),
          s("sqs", "SQS", "Integration", MessageSquare, ["queue"]),
          s("sns", "SNS", "Integration", Radio, ["pubsub"]),
          s("eventbridge", "EventBridge", "Integration", Workflow, ["pubsub"]),
          s("stepfunctions", "Step Functions", "Integration", Workflow, ["serverless"]),
          s("msk", "MSK", "Integration", Waves, ["streaming"]),
        ],
      },
      {
        name: "Security",
        services: [
          s("iam", "IAM", "Security", ShieldCheck, ["auth"]),
          s("cognito", "Cognito", "Security", Users, ["auth"]),
          s("kms", "KMS", "Security", Key, ["encryption"]),
          s("secrets", "Secrets Manager", "Security", FileKey, ["secrets"]),
          s("waf", "WAF", "Security", Shield, ["waf"]),
          s("shield", "Shield", "Security", ShieldCheck, ["waf"]),
          s("guardduty", "GuardDuty", "Security", Shield, ["monitoring"]),
        ],
      },
      {
        name: "Monitoring",
        services: [
          s("cloudwatch", "CloudWatch", "Monitoring", BarChart3, ["monitoring"]),
          s("cloudtrail", "CloudTrail", "Monitoring", Activity, ["monitoring"]),
          s("xray", "X-Ray", "Monitoring", Activity, ["tracing"]),
          s("config", "AWS Config", "Monitoring", Activity, ["monitoring"]),
        ],
      },
      {
        name: "CDN & Edge",
        services: [
          s("cloudfront", "CloudFront", "CDN & Edge", Globe, ["cdn"]),
          s("globalaccelerator", "Global Accelerator", "CDN & Edge", Globe, ["network"]),
        ],
      },
      {
        name: "DevOps",
        services: [
          s("codepipeline", "CodePipeline", "DevOps", Workflow, ["compute"]),
          s("codebuild", "CodeBuild", "DevOps", Cpu, ["compute"]),
          s("codedeploy", "CodeDeploy", "DevOps", Cloud, ["compute"]),
          s("ecr", "ECR", "DevOps", Archive, ["object-storage"]),
          s("cloudformation", "CloudFormation", "DevOps", Layers, ["compute"]),
        ],
      },
      {
        name: "Analytics",
        services: [
          s("athena", "Athena", "Analytics", Database, ["database"]),
          s("glue", "Glue", "Analytics", Layers, ["compute"]),
          s("kinesis", "Kinesis", "Analytics", Waves, ["streaming"]),
          s("emr", "EMR", "Analytics", Server, ["compute"]),
          s("redshift-analytics", "Redshift", "Analytics", Database, ["database"]),
        ],
      },
      {
        name: "AI / ML",
        services: [
          s("bedrock", "Bedrock", "AI / ML", Cpu, ["compute"]),
          s("sagemaker", "SageMaker", "AI / ML", Server, ["compute"]),
          s("knowledgebases", "Knowledge Bases", "AI / ML", Database, ["database"]),
          s("aiagents", "AI Agents", "AI / ML", Users, ["compute"]),
        ],
      },
      {
        name: "Migration",
        services: [
          s("dms", "DMS", "Migration", Database, ["network"]),
          s("datasync", "DataSync", "Migration", HardDrive, ["network"]),
          s("migrationhub", "Migration Hub", "Migration", Globe, ["network"]),
          s("directconnect", "Direct Connect", "Migration", Network, ["network"]),
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
          s("containerapps", "Container Apps", "Compute", Container, ["container", "compute"]),
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
          s("vpngw", "VPN Gateway", "Networking", Network, ["network"]),
          s("expressroute", "ExpressRoute", "Networking", Network, ["network"]),
          s("loadbalancer", "Azure Load Balancer", "Networking", Scale, ["load-balancer"]),
          s("trafficmanager", "Traffic Manager", "Networking", Route, ["dns", "load-balancer"]),
        ],
      },
      {
        name: "Storage",
        services: [
          s("blob", "Blob Storage", "Storage", Archive, ["object-storage"]),
          s("disk", "Managed Disks", "Storage", HardDrive, ["block-storage"]),
          s("files", "Azure Files", "Storage", HardDrive, ["block-storage"]),
          s("archive-tier", "Archive Storage", "Storage", Archive, ["archive"]),
          s("datalake", "Data Lake Storage", "Storage", Database, ["object-storage"]),
        ],
      },
      {
        name: "Database",
        services: [
          s("sqldb", "Azure SQL", "Database", Database, ["database", "managed-database"]),
          s("pgflex", "PostgreSQL Flexible", "Database", Database, ["database", "managed-database"]),
          s("mysql", "MySQL Flexible", "Database", Database, ["database", "managed-database"]),
          s("cosmos", "Cosmos DB", "Database", Layers, ["database", "nosql"]),
          s("rediscache", "Azure Cache for Redis", "Database", Gauge, ["cache"]),
        ],
      },
      {
        name: "Integration",
        services: [
          s("servicebus", "Service Bus", "Integration", MessageSquare, ["queue"]),
          s("eventgrid", "Event Grid", "Integration", Radio, ["pubsub"]),
          s("eventhubs", "Event Hubs", "Integration", Waves, ["streaming"]),
          s("logicapps", "Logic Apps", "Integration", Workflow, ["serverless"]),
          s("queuestorage", "Queue Storage", "Integration", MessageSquare, ["queue"]),
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
          s("ddos", "DDoS Protection", "Security", Shield, ["waf"]),
        ],
      },
      {
        name: "Monitoring",
        services: [
          s("monitor", "Azure Monitor", "Monitoring", BarChart3, ["monitoring"]),
          s("appinsights", "Application Insights", "Monitoring", Activity, ["tracing"]),
          s("loganalytics", "Log Analytics", "Monitoring", Activity, ["monitoring"]),
        ],
      },
      {
        name: "CDN & Edge",
        services: [
          s("azurecdn", "Azure CDN", "CDN & Edge", Globe, ["cdn"]),
          s("azurefrontdoor", "Azure Front Door", "CDN & Edge", Globe, ["cdn", "load-balancer"]),
        ],
      },
      {
        name: "DevOps",
        services: [
          s("azuredevops", "Azure DevOps", "DevOps", Workflow, ["compute"]),
          s("githubactions", "GitHub Actions", "DevOps", Zap, ["compute"]),
          s("acr", "Container Registry", "DevOps", Archive, ["object-storage"]),
          s("armbicep", "ARM / Bicep", "DevOps", Layers, ["compute"]),
        ],
      },
      {
        name: "Analytics",
        services: [
          s("synapse", "Synapse Analytics", "Analytics", Database, ["database"]),
          s("databricks", "Databricks", "Analytics", Layers, ["compute"]),
          s("datafactory", "Data Factory", "Analytics", Workflow, ["compute"]),
          s("hdinsight", "HDInsight", "Analytics", Server, ["compute"]),
          s("streamanalytics", "Stream Analytics", "Analytics", Waves, ["streaming"]),
        ],
      },
      {
        name: "AI / ML",
        services: [
          s("openai", "Azure OpenAI", "AI / ML", Cpu, ["compute"]),
          s("machinelearning", "Machine Learning", "AI / ML", Server, ["compute"]),
          s("cognitiveservices", "Cognitive Services", "AI / ML", Zap, ["compute"]),
          s("botservice", "Bot Service", "AI / ML", MessageSquare, ["compute"]),
        ],
      },
      {
        name: "Migration",
        services: [
          s("azuremigrate", "Azure Migrate", "Migration", Globe, ["network"]),
          s("asr", "Site Recovery", "Migration", Database, ["network"]),
          s("databox", "Data Box", "Migration", HardDrive, ["network"]),
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
        name: "Networking",
        services: [
          s("vpc", "VPC", "Networking", Network, ["network", "private-network"]),
          s("subnet", "Subnet", "Networking", Split, ["network"]),
          s("clouddns", "Cloud DNS", "Networking", Route, ["dns"]),
          s("cdn", "Cloud CDN", "Networking", Globe, ["cdn"]),
          s("apigee", "Apigee API Gateway", "Networking", Workflow, ["api-gateway"]),
          s("clb", "Cloud Load Balancing", "Networking", Scale, ["load-balancer"]),
          s("natgw", "Cloud NAT", "Networking", Network, ["network"]),
          s("cloudrouter", "Cloud Router", "Networking", Route, ["network"]),
          s("cloudinterconnect", "Cloud Interconnect", "Networking", Network, ["network"]),
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
          s("alloydb", "AlloyDB", "Database", Database, ["database", "managed-database"]),
        ],
      },
      {
        name: "Integration",
        services: [
          s("pubsub", "Pub/Sub", "Integration", Radio, ["pubsub", "queue"]),
          s("tasks", "Cloud Tasks", "Integration", Timer, ["queue"]),
          s("eventarc", "Eventarc", "Integration", Workflow, ["pubsub"]),
          s("cloudendpoints", "Cloud Endpoints", "Integration", Workflow, ["api-gateway"]),
          s("workflows", "Workflows", "Integration", Workflow, ["serverless"]),
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
          s("iap", "Identity-Aware Proxy", "Security", ShieldCheck, ["auth"]),
          s("scc", "Security Command Center", "Security", Shield, ["monitoring"]),
        ],
      },
      {
        name: "Monitoring",
        services: [
          s("monitoring", "Cloud Monitoring", "Monitoring", BarChart3, ["monitoring"]),
          s("trace", "Cloud Trace", "Monitoring", Activity, ["tracing"]),
          s("logging", "Cloud Logging", "Monitoring", Activity, ["monitoring"]),
          s("errorreporting", "Error Reporting", "Monitoring", Activity, ["monitoring"]),
        ],
      },
      {
        name: "CDN & Edge",
        services: [
          s("gcpcdn", "Cloud CDN", "CDN & Edge", Globe, ["cdn"]),
          s("mediacdn", "Media CDN", "CDN & Edge", Globe, ["cdn"]),
        ],
      },
      {
        name: "DevOps",
        services: [
          s("cloudbuild", "Cloud Build", "DevOps", Cpu, ["compute"]),
          s("clouddeploy", "Cloud Deploy", "DevOps", Cloud, ["compute"]),
          s("artifactregistry", "Artifact Registry", "DevOps", Archive, ["object-storage"]),
          s("sourcerepositories", "Source Repositories", "DevOps", Archive, ["compute"]),
          s("deploymentmanager", "Deployment Manager", "DevOps", Layers, ["compute"]),
        ],
      },
      {
        name: "Analytics",
        services: [
          s("bigquery", "BigQuery", "Analytics", Database, ["database"]),
          s("dataflow", "Dataflow", "Analytics", Waves, ["streaming"]),
          s("dataproc", "Dataproc", "Analytics", Server, ["compute"]),
          s("looker", "Looker", "Analytics", BarChart3, ["compute"]),
        ],
      },
      {
        name: "AI / ML",
        services: [
          s("vertexai", "Vertex AI", "AI / ML", Cpu, ["compute"]),
          s("cloudvision", "Cloud Vision", "AI / ML", Zap, ["compute"]),
          s("dialogflow", "Dialogflow", "AI / ML", MessageSquare, ["compute"]),
          s("speechtotext", "Speech-to-Text", "AI / ML", Radio, ["compute"]),
          s("naturallanguage", "Natural Language API", "AI / ML", Layers, ["compute"]),
        ],
      },
      {
        name: "Migration",
        services: [
          s("migratevms", "Migrate to VMs", "Migration", Server, ["network"]),
          s("dmsgcp", "Database Migration", "Migration", Database, ["network"]),
          s("storagetransfer", "Storage Transfer", "Migration", HardDrive, ["network"]),
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
  { id: "region", label: "Region", color: "var(--info)", icon: Globe },
  { id: "vpc", label: "VPC", color: "var(--primary)", icon: Network },
  { id: "az", label: "Availability Zone", color: "var(--muted-foreground)", icon: Cloud },
  { id: "public-subnet", label: "Public Subnet", color: "var(--warning)", icon: Split },
  { id: "private-subnet", label: "Private Subnet", color: "var(--success)", icon: Split },
  { id: "k8s", label: "Kubernetes Cluster", color: "var(--info)", icon: Boxes },
  { id: "service-group", label: "Service Group", color: "var(--primary)", icon: Layers },
  { id: "database-layer", label: "Database Layer", color: "var(--success)", icon: Database },
  { id: "security-boundary", label: "Security Boundary", color: "var(--destructive)", icon: Shield },
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