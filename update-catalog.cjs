const fs = require('fs');
let content = fs.readFileSync('src/lib/catalog.ts', 'utf8');
const start = content.indexOf('aws: {');
const categoriesStart = content.indexOf('categories: [', start);
const categoriesEnd = content.indexOf('    ],\n  },\n  azure: {');

const newCategories = `    categories: [
      {
        name: "Compute",
        services: [
          s("ec2", "Amazon EC2", "Compute", Server, ["compute"]),
          s("ec2-auto-scaling", "EC2 Auto Scaling", "Compute", Scale, ["autoscaling", "compute"]),
          s("lambda", "AWS Lambda", "Compute", Zap, ["serverless", "compute"]),
          s("fargate", "AWS Fargate", "Compute", Server, ["serverless", "compute"]),
          s("ecs", "Amazon ECS", "Compute", Boxes, ["container", "compute"]),
          s("eks", "Amazon EKS", "Compute", Boxes, ["container", "compute"]),
          s("elastic-beanstalk", "Elastic Beanstalk", "Compute", Cloud, ["compute"]),
          s("batch", "AWS Batch", "Compute", Cpu, ["compute"]),
          s("app-runner", "App Runner", "Compute", Cloud, ["container", "compute"]),
        ],
      },
      {
        name: "Networking",
        services: [
          s("vpc", "Amazon VPC", "Networking", Network, ["network", "private-network"]),
          s("public-subnet", "Public Subnet", "Networking", Split, ["network"]),
          s("private-subnet", "Private Subnet", "Networking", Split, ["network"]),
          s("internet-gateway", "Internet Gateway", "Networking", Globe, ["network"]),
          s("nat-gateway", "NAT Gateway", "Networking", Network, ["network"]),
          s("route-tables", "Route Tables", "Networking", Route, ["network"]),
          s("security-groups", "Security Groups", "Networking", Lock, ["network"]),
          s("network-acl", "Network ACL", "Networking", Lock, ["network"]),
          s("elb", "Elastic Load Balancing", "Networking", Scale, ["load-balancer"]),
          s("alb", "Application Load Balancer", "Networking", Scale, ["load-balancer"]),
          s("nlb", "Network Load Balancer", "Networking", Scale, ["load-balancer"]),
          s("route53", "Amazon Route 53", "Networking", Route, ["dns"]),
          s("transit-gateway", "Transit Gateway", "Networking", Route, ["network"]),
          s("privatelink", "AWS PrivateLink", "Networking", Shield, ["network"]),
          s("direct-connect", "AWS Direct Connect", "Networking", Globe, ["network"]),
          s("vpn", "AWS VPN", "Networking", Network, ["network"]),
        ],
      },
      {
        name: "Storage",
        services: [
          s("s3", "Amazon S3", "Storage", Archive, ["object-storage"]),
          s("ebs", "Amazon EBS", "Storage", HardDrive, ["block-storage"]),
          s("efs", "Amazon EFS", "Storage", HardDrive, ["block-storage"]),
          s("fsx", "Amazon FSx", "Storage", HardDrive, ["block-storage"]),
          s("glacier", "S3 Glacier", "Storage", Archive, ["archive"]),
          s("storage-gateway", "Storage Gateway", "Storage", HardDrive, ["object-storage"]),
        ],
      },
      {
        name: "Database",
        services: [
          s("rds", "Amazon RDS", "Database", Database, ["database", "managed-database"]),
          s("aurora", "Amazon Aurora", "Database", Database, ["database", "managed-database"]),
          s("dynamodb", "Amazon DynamoDB", "Database", Layers, ["database", "nosql"]),
          s("documentdb", "Amazon DocumentDB", "Database", Layers, ["database", "nosql"]),
          s("keyspaces", "Amazon Keyspaces", "Database", Layers, ["database", "nosql"]),
          s("elasticache", "Amazon ElastiCache", "Database", Gauge, ["cache"]),
          s("opensearch", "Amazon OpenSearch", "Database", Database, ["database"]),
          s("redshift", "Amazon Redshift", "Database", Database, ["database"]),
        ],
      },
      {
        name: "Integration",
        services: [
          s("api-gateway", "API Gateway", "Integration", Workflow, ["api-gateway"]),
          s("appsync", "AWS AppSync", "Integration", Globe, ["api-gateway"]),
          s("eventbridge", "Amazon EventBridge", "Integration", Workflow, ["pubsub"]),
          s("sqs", "Amazon SQS", "Integration", MessageSquare, ["queue"]),
          s("sns", "Amazon SNS", "Integration", Radio, ["pubsub"]),
          s("step-functions", "AWS Step Functions", "Integration", Workflow, ["compute"]),
          s("amazon-mq", "Amazon MQ", "Integration", MessageSquare, ["queue"]),
          s("msk", "Amazon MSK", "Integration", Waves, ["streaming"]),
        ],
      },
      {
        name: "Security",
        services: [
          s("iam", "AWS IAM", "Security", ShieldCheck, ["auth"]),
          s("cognito", "Amazon Cognito", "Security", Users, ["auth"]),
          s("kms", "AWS KMS", "Security", Key, ["encryption"]),
          s("secrets-manager", "Secrets Manager", "Security", FileKey, ["secrets"]),
          s("waf", "AWS WAF", "Security", Shield, ["waf"]),
          s("shield", "AWS Shield", "Security", Shield, ["waf"]),
          s("guardduty", "Amazon GuardDuty", "Security", Shield, ["monitoring"]),
          s("security-hub", "Security Hub", "Security", ShieldCheck, ["monitoring"]),
          s("inspector", "Amazon Inspector", "Security", Shield, ["monitoring"]),
          s("macie", "Amazon Macie", "Security", Shield, ["monitoring"]),
          s("cloudtrail", "AWS CloudTrail", "Security", FileKey, ["monitoring"]),
          s("network-firewall", "Network Firewall", "Security", Shield, ["waf"]),
          s("private-ca", "Private Certificate Authority", "Security", Key, ["encryption"]),
        ],
      },
      {
        name: "Monitoring",
        services: [
          s("cloudwatch", "Amazon CloudWatch", "Monitoring", BarChart3, ["monitoring"]),
          s("xray", "AWS X-Ray", "Monitoring", Activity, ["tracing"]),
          s("config", "AWS Config", "Monitoring", Gauge, ["monitoring"]),
          s("health-dashboard", "Health Dashboard", "Monitoring", Signal, ["monitoring"]),
          s("systems-manager", "Systems Manager", "Monitoring", Boxes, ["monitoring"]),
          s("prometheus", "Managed Prometheus", "Monitoring", Gauge, ["monitoring"]),
          s("grafana", "Managed Grafana", "Monitoring", BarChart3, ["monitoring"]),
        ],
      },
      {
        name: "CDN & Edge",
        services: [
          s("cloudfront", "Amazon CloudFront", "CDN & Edge", Globe, ["cdn"]),
          s("global-accelerator", "Global Accelerator", "CDN & Edge", Globe, ["cdn"]),
        ],
      },
      {
        name: "DevOps",
        services: [
          s("codepipeline", "CodePipeline", "DevOps", Workflow, ["compute"]),
          s("codebuild", "CodeBuild", "DevOps", Zap, ["compute"]),
          s("codedeploy", "CodeDeploy", "DevOps", Download, ["compute"]),
          s("codeartifact", "CodeArtifact", "DevOps", Archive, ["compute"]),
          s("ecr", "Amazon ECR", "DevOps", Package, ["container"]),
          s("cloudformation", "CloudFormation", "DevOps", Boxes, ["compute"]),
          s("cdk", "AWS CDK", "DevOps", Boxes, ["compute"]),
          s("proton", "AWS Proton", "DevOps", FileKey, ["compute"]),
          s("github", "GitHub", "DevOps", FileKey, ["compute"]),
          s("github-actions", "GitHub Actions", "DevOps", Zap, ["compute"]),
          s("jenkins", "Jenkins", "DevOps", Settings, ["compute"]),
          s("gitlab", "GitLab CI/CD", "DevOps", Boxes, ["compute"]),
          s("terraform", "Terraform", "DevOps", Boxes, ["compute"]),
          s("argocd", "Argo CD", "DevOps", Boxes, ["compute"]),
        ],
      },
      {
        name: "Analytics",
        services: [
          s("athena", "Amazon Athena", "Analytics", Search, ["data"]),
          s("emr", "Amazon EMR", "Analytics", Waves, ["data"]),
          s("kinesis-streams", "Kinesis Data Streams", "Analytics", Waves, ["streaming"]),
          s("kinesis-firehose", "Kinesis Firehose", "Analytics", Waves, ["streaming"]),
          s("glue", "AWS Glue", "Analytics", Boxes, ["data"]),
          s("lake-formation", "Lake Formation", "Analytics", Database, ["data"]),
          s("quicksight", "Amazon QuickSight", "Analytics", BarChart3, ["data"]),
        ],
      },
      {
        name: "AI/ML",
        services: [
          s("sagemaker", "Amazon SageMaker", "AI/ML", Brain, ["compute"]),
          s("bedrock", "Amazon Bedrock", "AI/ML", Bot, ["compute"]),
          s("bedrock-knowledge", "Knowledge Bases", "AI/ML", Database, ["compute"]),
          s("bedrock-agents", "AI Agents", "AI/ML", Bot, ["compute"]),
          s("rekognition", "Amazon Rekognition", "AI/ML", Activity, ["compute"]),
          s("textract", "Amazon Textract", "AI/ML", Activity, ["compute"]),
          s("comprehend", "Amazon Comprehend", "AI/ML", Activity, ["compute"]),
          s("transcribe", "Amazon Transcribe", "AI/ML", Activity, ["compute"]),
          s("polly", "Amazon Polly", "AI/ML", Activity, ["compute"]),
          s("translate", "Amazon Translate", "AI/ML", Activity, ["compute"]),
        ],
      },
      {
        name: "Migration",
        services: [
          s("migration-hub", "Migration Hub", "Migration", Split, ["compute"]),
          s("app-migration", "App Migration Service", "Migration", Split, ["compute"]),
          s("dms", "AWS DMS", "Migration", Split, ["compute"]),
          s("datasync", "AWS DataSync", "Migration", HardDrive, ["compute"]),
          s("transfer-family", "Transfer Family", "Migration", HardDrive, ["compute"]),
          s("snow-family", "Snow Family", "Migration", HardDrive, ["compute"]),
          s("outposts", "AWS Outposts", "Migration", Server, ["compute"]),
        ],
      },
      {
        name: "Management",
        services: [
          s("organizations", "Organizations", "Management", Layers, ["compute"]),
          s("control-tower", "Control Tower", "Management", ShieldCheck, ["compute"]),
          s("ram", "Resource Access Manager", "Management", Key, ["compute"]),
          s("service-catalog", "Service Catalog", "Management", Boxes, ["compute"]),
          s("trusted-advisor", "Trusted Advisor", "Management", ShieldCheck, ["monitoring"]),
          s("cost-explorer", "Cost Explorer", "Management", BarChart3, ["monitoring"]),
          s("budgets", "AWS Budgets", "Management", BarChart3, ["monitoring"]),
        ],
      },
      {
        name: "IoT",
        services: [
          s("iot-core", "IoT Core", "IoT", Radio, ["compute"]),
          s("iot-greengrass", "IoT Greengrass", "IoT", Cloud, ["compute"]),
          s("iot-device-mgmt", "IoT Device Management", "IoT", Radio, ["compute"]),
          s("iot-events", "IoT Events", "IoT", Radio, ["compute"]),
          s("iot-sitewise", "IoT SiteWise", "IoT", Radio, ["compute"]),
          s("iot-twinmaker", "IoT TwinMaker", "IoT", Radio, ["compute"]),
        ],
      },
      {
        name: "Developer Services",
        services: [
          s("appconfig", "AWS AppConfig", "Developer Services", Settings, ["compute"]),
          s("amplify", "AWS Amplify", "Developer Services", Smartphone, ["compute"]),
          s("cloudshell", "AWS CloudShell", "Developer Services", Terminal, ["compute"]),
          s("cloud9", "AWS Cloud9", "Developer Services", Boxes, ["compute"]),
        ],
      }`;

const finalContent = content.substring(0, categoriesStart) + newCategories + content.substring(categoriesEnd);
fs.writeFileSync('src/lib/catalog.ts', finalContent);
console.log('updated aws catalog');
