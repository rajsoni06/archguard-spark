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
  Settings,
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
  | "reverse-proxy"
  | "api-gateway"
  | "compute"
  | "container"
  | "serverless"
  | "autoscaling"
  | "cache"
  | "database"
  | "managed-database"
  | "sql"
  | "nosql"
  | "warehouse"
  | "search"
  | "object-storage"
  | "storage"
  | "block-storage"
  | "archive"
  | "queue"
  | "pubsub"
  | "streaming"
  | "event-bus"
  | "etl"
  | "data-lake"
  | "data-catalog"
  | "bi"
  | "ml"
  | "auth"
  | "secrets"
  | "encryption"
  | "network"
  | "private-network"
  | "monitoring"
  | "tracing"
  | "replication"
  | "read-replica"
  | "health-check"
  | "failover";

export interface ServiceDef {
  id: string;
  name: string;
  category: string;
  icon: LucideIcon;
  iconUrl?: string;
  caps: Capability[];
  note?: string;
  /** Optional hints used by architecture review and boundary-aware layout. */
  recommendedBoundaries?: string[];
  relationships?: { to: Capability[]; mode: "sync" | "async" | "data" }[];
}

export interface CloudDef {
  id: CloudId;
  name: string;
  short: string;
  colorVar: string;
  categories: { name: string; services: ServiceDef[] }[];
}

export function getBoundaryLabel(kind: BoundaryKind, cloud?: CloudId): string {
  if (kind === "vpc") {
    if (cloud === "azure") return "Virtual Network (VNet)";
    if (cloud === "aws") return "VPC";
    return "Virtual Network";
  }

  return BOUNDARY_KINDS.find((b) => b.id === kind)?.label ?? kind;
}

const s = (
  id: string,
  name: string,
  category: string,
  icon: LucideIcon,
  caps: Capability[],
  metadata?: Pick<ServiceDef, "note" | "recommendedBoundaries" | "relationships">,
): ServiceDef => ({ id, name, category, icon, caps, ...metadata });

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
          s("autoscaling-group", "Auto Scaling Group", "Compute", Scale, ["autoscaling"]),
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
          s("elb", "Elastic Load Balancing", "Networking", Scale, ["load-balancer", "health-check", "failover"]),
          s("reverse-proxy", "Reverse Proxy", "Networking", Route, ["reverse-proxy", "load-balancer"]),
          s("route53", "Route 53", "Networking", Route, ["dns"]),
          s("transit-gateway", "Transit Gateway", "Networking", Network, ["network"]),
          s("target-group", "Target Group", "Networking", Split, ["load-balancer"]),
          s("kubernetes-ingress", "Ingress", "Networking", Route, ["reverse-proxy", "load-balancer"]),
          s("availability-zone", "Availability Zone", "Networking", Globe, ["network", "failover"]),
          s("private-link", "PrivateLink", "Networking", Network, ["private-network"]),
        ],
      },
      {
        name: "Storage",
        services: [
          s("s3", "S3", "Storage", Archive, ["object-storage"]),
          s("ebs", "EBS", "Storage", HardDrive, ["block-storage"]),
          s("efs", "EFS", "Storage", HardDrive, ["block-storage"]),
          s("glacier", "Glacier", "Storage", Archive, ["archive"]),
          s("s3-bucket", "S3 Bucket", "Storage", Archive, ["object-storage"]),
          s("s3-object", "S3 Object", "Storage", Archive, ["object-storage"]),
        ],
      },
      {
        name: "Database",
        services: [
          s("rds", "RDS (SQL)", "Database", Database, ["database", "managed-database", "sql", "read-replica", "replication"]),
          s("aurora", "Aurora (SQL)", "Database", Database, ["database", "managed-database", "sql", "read-replica", "replication"]),
          s("dynamodb", "DynamoDB", "Database", Layers, ["database", "nosql"]),
          s("elasticache", "ElastiCache", "Database", Gauge, ["cache"]),
          s("opensearch", "OpenSearch", "Database", Database, ["database", "search"]),
          s("redshift", "Redshift", "Database", Database, ["database", "warehouse"]),
          s("rds-proxy", "RDS Proxy", "Database", Network, ["database", "managed-database"]),
          s("rds-read-replica", "RDS Read Replica", "Database", Database, ["database", "read-replica", "replication"]),
          s("rds-multi-az", "RDS Multi-AZ", "Database", Database, ["database", "managed-database", "failover"]),
          s("dax", "DynamoDB Accelerator (DAX)", "Database", Gauge, ["cache", "database"]),
          s("documentdb", "DocumentDB", "Database", Database, ["database", "nosql"]),
          s("keyspaces", "Keyspaces for Apache Cassandra", "Database", Database, ["database", "nosql"]),
        ],
      },
      {
        name: "Integration",
        services: [
          s("apigw", "API Gateway", "Integration", Workflow, ["api-gateway"]),
          s("sqs", "SQS", "Integration", MessageSquare, ["queue"]),
          s("sns", "SNS", "Integration", Radio, ["pubsub"]),
          s("eventbridge", "EventBridge", "Integration", Workflow, ["pubsub"]),
          s("event-bus", "Event Bus", "Integration", Workflow, ["event-bus", "pubsub"]),
          s("stepfunctions", "Step Functions", "Integration", Workflow, ["serverless"]),
          s("msk", "MSK", "Integration", Waves, ["streaming"]),
        ],
      },
      {
        name: "API & Application Integration",
        services: [
          s("api-rest", "API Gateway REST API", "API & Application Integration", Workflow, ["api-gateway"]),
          s("api-http", "API Gateway HTTP API", "API & Application Integration", Workflow, ["api-gateway"]),
          s("api-websocket", "API Gateway WebSocket API", "API & Application Integration", Workflow, ["api-gateway"]),
          s("api-endpoint", "API Gateway Endpoint", "API & Application Integration", Route, ["api-gateway"]),
          s("lambda-integration", "Lambda Integration", "API & Application Integration", Zap, ["api-gateway", "serverless"]),
          s("api-authentication", "API Gateway Authentication", "API & Application Integration", ShieldCheck, ["api-gateway", "auth"]),
          s("api-authorizer", "API Gateway Authorizer", "API & Application Integration", ShieldCheck, ["api-gateway", "auth"]),
          s("api-mapping", "API Gateway Mapping", "API & Application Integration", Split, ["api-gateway"]),
          s("api-cache", "API Gateway Cache", "API & Application Integration", Gauge, ["api-gateway", "cache"]),
        ],
      },
      {
        name: "Containers & Kubernetes",
        services: [
          s("ecr-container", "Elastic Container Registry (ECR)", "Containers & Kubernetes", Archive, ["container", "object-storage"]),
          s("kubernetes-cluster", "Kubernetes Cluster", "Containers & Kubernetes", Boxes, ["container"]),
          s("kubernetes-pod", "Kubernetes Pod", "Containers & Kubernetes", Container, ["container"]),
          s("kubernetes-service", "Kubernetes Service", "Containers & Kubernetes", Network, ["container", "network"]),
          s("kubernetes-ingress-resource", "Kubernetes Ingress", "Containers & Kubernetes", Route, ["container", "reverse-proxy"]),
          s("alb-ingress", "ALB Ingress", "Containers & Kubernetes", Scale, ["container", "load-balancer"]),
          s("replicaset", "Kubernetes ReplicaSet", "Containers & Kubernetes", Boxes, ["container", "autoscaling"]),
          s("cluster-autoscaler", "Cluster Autoscaler", "Containers & Kubernetes", Scale, ["container", "autoscaling"]),
          s("kubernetes-node", "Kubernetes Node", "Containers & Kubernetes", Server, ["container", "compute"]),
        ],
      },
      {
        name: "Caching",
        services: [
          s("redis", "ElastiCache for Redis", "Caching", Gauge, ["cache"]),
          s("memcached", "ElastiCache for Memcached", "Caching", Gauge, ["cache"]),
          s("cloudfront-cache", "CloudFront Cache", "Caching", Globe, ["cache", "cdn"]),
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
          s("iam-user", "IAM User", "Security", Users, ["auth"]),
          s("iam-role", "IAM Role", "Security", ShieldCheck, ["auth"]),
          s("iam-policy", "IAM Policy", "Security", FileKey, ["auth"]),
          s("cognito-user-pool", "Cognito User Pool", "Security", Users, ["auth"]),
          s("cognito-identity-pool", "Cognito Identity Pool", "Security", Users, ["auth"]),
          s("security-group", "EC2 Security Group", "Security", Lock, ["private-network"]),
          s("network-acl", "Network ACL (NACL)", "Security", Lock, ["private-network"]),
        ],
      },
      {
        name: "Monitoring",
        services: [
          s("cloudwatch", "CloudWatch", "Monitoring", BarChart3, ["monitoring"]),
          s("cloudtrail", "CloudTrail", "Monitoring", Activity, ["monitoring"]),
          s("xray", "X-Ray", "Monitoring", Activity, ["tracing"]),
          s("config", "AWS Config", "Monitoring", Activity, ["monitoring"]),
          s("cloudwatch-logs", "CloudWatch Logs", "Monitoring", Archive, ["monitoring"]),
          s("cloudwatch-metrics", "CloudWatch Metrics", "Monitoring", BarChart3, ["monitoring"]),
          s("cloudwatch-alarms", "CloudWatch Alarms", "Monitoring", Activity, ["monitoring"]),
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
          s("cdk", "CDK", "DevOps", Layers, ["compute"]),
          s("systems-manager", "Systems Manager", "DevOps", Settings, ["compute"]),
        ],
      },
      {
        name: "Analytics",
        services: [
          s("athena", "Athena", "Analytics", Database, ["database", "warehouse"]),
          s("glue", "Glue ETL", "Analytics", Layers, ["compute", "etl", "data-catalog"]),
          s("datalake", "S3 Data Lake", "Analytics", Archive, ["object-storage", "data-lake"]),
          s("datacatalog", "Glue Data Catalog", "Analytics", Layers, ["data-catalog"]),
          s("kinesis", "Kinesis", "Analytics", Waves, ["streaming"]),
          s("emr", "EMR", "Analytics", Server, ["compute"]),
          s("redshift-analytics", "Redshift", "Analytics", Database, ["database"]),
          s("quicksight", "QuickSight", "Analytics", BarChart3, ["bi"]),
          s("kinesis-data-streams", "Kinesis Data Streams", "Analytics", Waves, ["streaming"]),
          s("kinesis-firehose", "Kinesis Data Firehose", "Analytics", Waves, ["streaming"]),
          s("glue-crawler", "Glue Crawler", "Analytics", Layers, ["etl", "data-catalog"]),
          s("glue-etl", "Glue ETL", "Analytics", Layers, ["etl"]),
          s("redshift-spectrum", "Redshift Spectrum", "Analytics", Database, ["database", "warehouse"]),
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
        name: "CDN & DNS",
        services: [
          s("hosted-zone", "Route 53 Hosted Zone", "CDN & DNS", Globe, ["dns"]),
          s("dns-record", "Route 53 Record", "CDN & DNS", Route, ["dns"]),
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
          s("reverse-proxy", "Reverse Proxy", "Networking", Route, ["reverse-proxy", "load-balancer"]),
          s("frontdoor", "Front Door", "Networking", Globe, ["cdn", "load-balancer"]),
          s("vpngw", "VPN Gateway", "Networking", Network, ["network"]),
          s("expressroute", "ExpressRoute", "Networking", Network, ["network"]),
          s("loadbalancer", "Azure Load Balancer", "Networking", Scale, ["load-balancer"]),
          s("trafficmanager", "Traffic Manager", "Networking", Route, ["dns", "load-balancer"]),
          s("azure-availability-zone", "Availability Zone", "Networking", Globe, ["network", "failover"]),
          s("azure-nat-gateway", "NAT Gateway", "Networking", Network, ["network"]),
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
          s("azure-storage-account", "Storage Account", "Storage", Archive, ["object-storage"]),
          s("azure-blob-object", "Blob Object", "Storage", Archive, ["object-storage"]),
        ],
      },
      {
        name: "Database",
        services: [
          s("sqldb", "Azure SQL", "Database", Database, ["database", "managed-database", "sql", "read-replica", "replication"]),
          s("pgflex", "PostgreSQL Flexible", "Database", Database, ["database", "managed-database"]),
          s("mysql", "MySQL Flexible", "Database", Database, ["database", "managed-database"]),
          s("cosmos", "Cosmos DB", "Database", Layers, ["database", "nosql", "replication"]),
          s("rediscache", "Azure Cache for Redis", "Database", Gauge, ["cache"]),
          s("azure-sql-replica", "Azure SQL Read Replica", "Database", Database, ["database", "read-replica", "replication"]),
        ],
      },
      {
        name: "Integration",
        services: [
          s("servicebus", "Service Bus", "Integration", MessageSquare, ["queue"]),
          s("eventgrid", "Event Grid", "Integration", Radio, ["pubsub"]),
          s("eventhubs", "Event Hubs", "Integration", Waves, ["streaming"]),
          s("eventbus", "Event Bus", "Integration", Workflow, ["event-bus", "pubsub"]),
          s("logicapps", "Logic Apps", "Integration", Workflow, ["serverless"]),
          s("queuestorage", "Queue Storage", "Integration", MessageSquare, ["queue"]),
        ],
      },
      {
        name: "API & Application Integration",
        services: [
          s("azure-rest-api", "API Management REST API", "API & Application Integration", Workflow, ["api-gateway"]),
          s("azure-http-api", "API Management HTTP API", "API & Application Integration", Workflow, ["api-gateway"]),
          s("azure-websocket-api", "API Management WebSocket API", "API & Application Integration", Workflow, ["api-gateway"]),
          s("azure-api-endpoint", "API Management Endpoint", "API & Application Integration", Route, ["api-gateway"]),
          s("azure-api-authorizer", "API Management Authorizer", "API & Application Integration", ShieldCheck, ["api-gateway", "auth"]),
          s("azure-api-policy", "API Management Policy", "API & Application Integration", FileKey, ["api-gateway"]),
          s("azure-api-cache", "API Management Cache", "API & Application Integration", Gauge, ["api-gateway", "cache"]),
        ],
      },
      {
        name: "Containers & Kubernetes",
        services: [
          s("azure-kubernetes-cluster", "Kubernetes Cluster", "Containers & Kubernetes", Boxes, ["container"]),
          s("azure-kubernetes-pod", "Kubernetes Pod", "Containers & Kubernetes", Container, ["container"]),
          s("azure-kubernetes-service", "Kubernetes Service", "Containers & Kubernetes", Network, ["container", "network"]),
          s("azure-kubernetes-ingress", "Kubernetes Ingress", "Containers & Kubernetes", Route, ["container", "reverse-proxy"]),
          s("azure-replicaset", "Kubernetes ReplicaSet", "Containers & Kubernetes", Boxes, ["container", "autoscaling"]),
          s("azure-cluster-autoscaler", "Cluster Autoscaler", "Containers & Kubernetes", Scale, ["container", "autoscaling"]),
          s("azure-kubernetes-node", "Kubernetes Node", "Containers & Kubernetes", Server, ["container", "compute"]),
        ],
      },
      {
        name: "Caching",
        services: [
          s("azure-redis", "Azure Cache for Redis", "Caching", Gauge, ["cache"]),
          s("azure-cache-api", "API Management Cache", "Caching", Gauge, ["cache", "api-gateway"]),
          s("azure-frontdoor-cache", "Azure Front Door Cache", "Caching", Globe, ["cache", "cdn"]),
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
          s("managed-identity", "Managed Identity", "Security", Users, ["auth"]),
          s("rbac-role", "Azure RBAC Role", "Security", ShieldCheck, ["auth"]),
          s("private-endpoint", "Private Endpoint", "Security", Network, ["private-network"]),
        ],
      },
      {
        name: "Monitoring",
        services: [
          s("monitor", "Azure Monitor", "Monitoring", BarChart3, ["monitoring"]),
          s("appinsights", "Application Insights", "Monitoring", Activity, ["tracing"]),
          s("loganalytics", "Log Analytics", "Monitoring", Activity, ["monitoring"]),
          s("azure-monitor-metrics", "Monitor Metrics", "Monitoring", BarChart3, ["monitoring"]),
          s("azure-monitor-alerts", "Monitor Alerts", "Monitoring", Activity, ["monitoring"]),
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
          s("synapse", "Synapse Analytics", "Analytics", Database, ["database", "warehouse"]),
          s("databricks", "Databricks", "Analytics", Layers, ["compute"]),
          s("datafactory", "Data Factory ETL", "Analytics", Workflow, ["compute", "etl"]),
          s("datalakegen2", "Data Lake Storage Gen2", "Analytics", Archive, ["object-storage", "data-lake"]),
          s("datacatalog", "Microsoft Purview", "Analytics", Layers, ["data-catalog"]),
          s("powerbi", "Power BI", "Analytics", BarChart3, ["bi"]),
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
          s("reverse-proxy", "Reverse Proxy", "Networking", Route, ["reverse-proxy", "load-balancer"]),
          s("natgw", "Cloud NAT", "Networking", Network, ["network"]),
          s("cloudrouter", "Cloud Router", "Networking", Route, ["network"]),
          s("cloudinterconnect", "Cloud Interconnect", "Networking", Network, ["network"]),
          s("gcp-availability-zone", "Availability Zone", "Networking", Globe, ["network", "failover"]),
          s("gcp-load-balancer", "Application Load Balancer", "Networking", Scale, ["load-balancer"]),
        ],
      },
      {
        name: "Storage",
        services: [
          s("gcs", "Cloud Storage", "Storage", Archive, ["object-storage"]),
          s("pd", "Persistent Disk", "Storage", HardDrive, ["block-storage"]),
          s("filestore", "Filestore", "Storage", HardDrive, ["block-storage"]),
          s("coldline", "Coldline Archive", "Storage", Archive, ["archive"]),
          s("gcs-bucket", "Cloud Storage Bucket", "Storage", Archive, ["object-storage"]),
          s("gcs-object", "Cloud Storage Object", "Storage", Archive, ["object-storage"]),
        ],
      },
      {
        name: "Database",
        services: [
          s("cloudsql", "Cloud SQL", "Database", Database, ["database", "managed-database", "sql", "read-replica", "replication"]),
          s("spanner", "Spanner", "Database", Database, ["database", "managed-database", "sql", "replication"]),
          s("firestore", "Firestore", "Database", Layers, ["database", "nosql"]),
          s("bigtable", "Bigtable", "Database", Layers, ["database", "nosql", "replication"]),
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
          s("eventbus", "Event Bus", "Integration", Workflow, ["event-bus", "pubsub"]),
          s("cloudendpoints", "Cloud Endpoints", "Integration", Workflow, ["api-gateway"]),
          s("workflows", "Workflows", "Integration", Workflow, ["serverless"]),
        ],
      },
      {
        name: "API & Application Integration",
        services: [
          s("gcp-rest-api", "API Gateway REST API", "API & Application Integration", Workflow, ["api-gateway"]),
          s("gcp-http-api", "API Gateway HTTP API", "API & Application Integration", Workflow, ["api-gateway"]),
          s("gcp-websocket-api", "API Gateway WebSocket API", "API & Application Integration", Workflow, ["api-gateway"]),
          s("gcp-api-endpoint", "API Gateway Endpoint", "API & Application Integration", Route, ["api-gateway"]),
          s("gcp-api-authentication", "API Gateway Authentication", "API & Application Integration", ShieldCheck, ["api-gateway", "auth"]),
          s("gcp-api-authorizer", "API Gateway Authorizer", "API & Application Integration", ShieldCheck, ["api-gateway", "auth"]),
          s("gcp-api-cache", "API Gateway Cache", "API & Application Integration", Gauge, ["api-gateway", "cache"]),
        ],
      },
      {
        name: "Containers & Kubernetes",
        services: [
          s("gcp-kubernetes-cluster", "Kubernetes Cluster", "Containers & Kubernetes", Boxes, ["container"]),
          s("gcp-kubernetes-pod", "Kubernetes Pod", "Containers & Kubernetes", Container, ["container"]),
          s("gcp-kubernetes-service", "Kubernetes Service", "Containers & Kubernetes", Network, ["container", "network"]),
          s("gcp-kubernetes-ingress", "Kubernetes Ingress", "Containers & Kubernetes", Route, ["container", "reverse-proxy"]),
          s("gcp-replicaset", "Kubernetes ReplicaSet", "Containers & Kubernetes", Boxes, ["container", "autoscaling"]),
          s("gcp-cluster-autoscaler", "Cluster Autoscaler", "Containers & Kubernetes", Scale, ["container", "autoscaling"]),
          s("gcp-kubernetes-node", "Kubernetes Node", "Containers & Kubernetes", Server, ["container", "compute"]),
        ],
      },
      {
        name: "Caching",
        services: [
          s("gcp-redis", "Memorystore for Redis", "Caching", Gauge, ["cache"]),
          s("gcp-memcached", "Memorystore for Memcached", "Caching", Gauge, ["cache"]),
          s("gcp-cdn-cache", "Cloud CDN Cache", "Caching", Globe, ["cache", "cdn"]),
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
          s("service-account", "Service Account", "Security", Users, ["auth"]),
          s("iam-role", "IAM Role", "Security", ShieldCheck, ["auth"]),
          s("iam-policy", "IAM Policy", "Security", FileKey, ["auth"]),
          s("private-service-connect", "Private Service Connect", "Security", Network, ["private-network"]),
        ],
      },
      {
        name: "Monitoring",
        services: [
          s("monitoring", "Cloud Monitoring", "Monitoring", BarChart3, ["monitoring"]),
          s("trace", "Cloud Trace", "Monitoring", Activity, ["tracing"]),
          s("logging", "Cloud Logging", "Monitoring", Activity, ["monitoring"]),
          s("errorreporting", "Error Reporting", "Monitoring", Activity, ["monitoring"]),
          s("alerting", "Cloud Monitoring Alerting", "Monitoring", Activity, ["monitoring"]),
          s("metrics", "Cloud Monitoring Metrics", "Monitoring", BarChart3, ["monitoring"]),
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
          s("bigquery", "BigQuery", "Analytics", Database, ["database", "warehouse"]),
          s("dataflow", "Dataflow", "Analytics", Waves, ["streaming"]),
          s("datalake", "Cloud Storage Data Lake", "Analytics", Archive, ["object-storage", "data-lake"]),
          s("datacatalog", "Dataplex Data Catalog", "Analytics", Layers, ["data-catalog"]),
          s("datafusion", "Cloud Data Fusion ETL", "Analytics", Workflow, ["etl"]),
          s("lookerstudio", "Looker Studio", "Analytics", BarChart3, ["bi"]),
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
  { id: "vpc", label: "Virtual Network", color: "var(--primary)", icon: Network },
  { id: "az", label: "Availability Zone", color: "var(--muted-foreground)", icon: Cloud },
  { id: "public-subnet", label: "Public Subnet", color: "var(--warning)", icon: Split },
  { id: "private-subnet", label: "Private Subnet", color: "var(--success)", icon: Split },
  { id: "security-zone", label: "Security Zone", color: "var(--destructive)", icon: Shield },
  { id: "service-boundary", label: "Service Boundary", color: "var(--primary)", icon: Layers },
] as const;

/** Legacy kinds remain supported when loading older diagrams but are hidden from the library. */
export type BoundaryKind =
  | (typeof BOUNDARY_KINDS)[number]["id"]
  | "k8s"
  | "service-group"
  | "database-layer"
  | "security-boundary";

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
