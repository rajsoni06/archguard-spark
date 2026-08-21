import type { BoundaryKind, Capability, CloudId, ServiceDef } from "./catalog";

export type BoundaryPlacement = "Recommended" | "Allowed" | "External";
type PlacementService = Pick<ServiceDef, "id" | "category" | "caps">;

const GLOBAL_EDGE_SERVICE_IDS = new Set([
  "cloudfront",
  "frontdoor",
  "azurefrontdoor",
  "azurecdn",
  "gcpcdn",
  "mediacdn",
  "cdn",
  "clouddns",
  "route53",
  "dns",
  "trafficmanager",
  "globalaccelerator",
]);

const GLOBAL_IDENTITY_SERVICE_IDS = new Set([
  "iam",
  "entra",
  "identityplatform",
  "iap",
  "auth0",
]);

const DEVOPS_SERVICE_IDS = new Set([
  "githubactions",
  "azuredevops",
  "cloudbuild",
  "clouddeploy",
  "cloudformation",
  "armbicep",
  "cdk",
  "proton",
]);

const REGION_EXTERNAL_CATEGORIES = new Set(["clients", "cdn & edge", "devops"]);
const VPC_EXTERNAL_CATEGORIES = new Set(["clients", "cdn & edge", "devops", "monitoring"]);
const AZ_EXTERNAL_CATEGORIES = new Set(["clients", "cdn & edge", "devops"]);
const SUBNET_EXTERNAL_CATEGORIES = new Set(["clients", "cdn & edge", "devops", "monitoring"]);
const K8S_EXTERNAL_CATEGORIES = new Set(["clients", "cdn & edge", "devops", "monitoring"]);
const DATABASE_LAYER_EXTERNAL_CATEGORIES = new Set(["clients", "cdn & edge", "devops"]);

// These services are security controls even when their provider catalog uses a
// networking category. Keep the security boundary focused on controls rather
// than every service that happens to have a network capability.
const SECURITY_CONTROL_IDS = new Set([
  "iam", "cognito", "entra", "identityplatform", "iap",
  "waf", "armor", "ddos", "shield", "guardduty", "defender", "scc",
  "nsg", "firewall", "security-group", "keyvault", "secrets", "secretmanager", "kms",
]);

function categoryKey(service: PlacementService): string {
  return service.category.trim().toLowerCase();
}

function hasAnyCap(service: PlacementService, caps: Capability[]): boolean {
  const set = new Set(service.caps);
  return caps.some((cap) => set.has(cap));
}

function isGlobalEdge(service: PlacementService): boolean {
  return GLOBAL_EDGE_SERVICE_IDS.has(service.id.toLowerCase()) || hasAnyCap(service, ["cdn", "dns"]);
}

function isIdentity(service: PlacementService): boolean {
  return GLOBAL_IDENTITY_SERVICE_IDS.has(service.id.toLowerCase()) || hasAnyCap(service, ["auth"]);
}

function isDevOps(service: PlacementService): boolean {
  return DEVOPS_SERVICE_IDS.has(service.id.toLowerCase()) || categoryKey(service) === "devops";
}

function isMonitoring(service: PlacementService): boolean {
  return categoryKey(service) === "monitoring" || hasAnyCap(service, ["monitoring", "tracing"]);
}

function isComputeLike(service: PlacementService): boolean {
  return hasAnyCap(service, ["compute", "container", "serverless", "autoscaling"]);
}

function isNetworkLike(service: PlacementService): boolean {
  return hasAnyCap(service, ["network", "private-network", "load-balancer", "api-gateway"]);
}

function isDataLike(service: PlacementService): boolean {
  return hasAnyCap(service, ["database", "managed-database", "sql", "nosql", "warehouse", "search", "cache", "data-lake"]);
}

function isStorageLike(service: PlacementService): boolean {
  return hasAnyCap(service, ["object-storage", "block-storage", "archive"]);
}

function isAnalyticsLike(service: PlacementService): boolean {
  return categoryKey(service) === "analytics" || hasAnyCap(service, ["etl", "data-catalog", "bi", "ml"]);
}

function isAiMlLike(service: PlacementService): boolean {
  return categoryKey(service) === "ai / ml";
}

function isIntegrationLike(service: PlacementService): boolean {
  return categoryKey(service) === "integration" || hasAnyCap(service, ["queue", "pubsub", "streaming"]);
}

function isSecurityLike(service: PlacementService): boolean {
  return categoryKey(service) === "security" || hasAnyCap(service, ["waf", "secrets", "encryption"]);
}

function isSecurityControl(service: PlacementService): boolean {
  return SECURITY_CONTROL_IDS.has(service.id.toLowerCase()) || isSecurityLike(service) || isIdentity(service);
}

function isAzurePaaS(service: PlacementService, cloud: CloudId): boolean {
  return cloud === "azure" && ["appservice", "functions"].includes(service.id.toLowerCase());
}

function isDatabricksLike(service: PlacementService, cloud: CloudId): boolean {
  return cloud === "azure" && service.id.toLowerCase() === "databricks";
}

function physicalBoundaryPlacement(
  kind: BoundaryKind,
  service: PlacementService,
  cloud: CloudId,
): BoundaryPlacement {
  const category = categoryKey(service);

  if (kind === "service-group" || kind === "service-boundary") {
    if (isGlobalEdge(service) || isIdentity(service) || isDevOps(service)) return "Allowed";
    if (category === "compute" || category === "integration" || hasAnyCap(service, ["compute", "container", "serverless", "queue", "pubsub", "streaming"])) return "Recommended";
    return "External";
  }

  if (kind === "security-boundary" || kind === "security-zone") {
    if (isSecurityControl(service)) {
      return "Recommended";
    }
    return "External";
  }

  if (kind === "region") {
    if (isGlobalEdge(service) || isIdentity(service) || isDevOps(service)) return "External";
    if (category === "clients") return "External";
    return "Recommended";
  }

  if (kind === "vpc") {
    if (isGlobalEdge(service) || isIdentity(service) || isDevOps(service) || category === "clients") return "External";
    if (isMonitoring(service)) return "External";
    if (isAzurePaaS(service, cloud)) return "External";
    if (isComputeLike(service) || isNetworkLike(service) || isSecurityLike(service)) return "Recommended";
    if (isDataLike(service) || isStorageLike(service) || isIntegrationLike(service) || isAnalyticsLike(service) || isAiMlLike(service)) {
      return "Recommended";
    }
    return "Allowed";
  }

  if (kind === "az") {
    if (isGlobalEdge(service) || isIdentity(service) || isDevOps(service) || category === "clients") return "External";
    if (isAzurePaaS(service, cloud)) return "External";
    if (isComputeLike(service) || isNetworkLike(service) || isDataLike(service) || isStorageLike(service) || isAnalyticsLike(service) || isAiMlLike(service)) {
      return "Recommended";
    }
    if (isIntegrationLike(service) || isMonitoring(service)) return "Recommended";
    return "External";
  }

  if (kind === "public-subnet") {
    if (category === "clients" || isGlobalEdge(service) || isIdentity(service) || isDevOps(service) || isMonitoring(service) || isDataLike(service)) {
      return "External";
    }
    if (isAzurePaaS(service, cloud)) return "External";
    if (hasAnyCap(service, ["load-balancer", "api-gateway", "reverse-proxy", "waf"])) return "Recommended";
    return "External";
  }

  if (kind === "private-subnet") {
    if (category === "clients" || isGlobalEdge(service) || isIdentity(service) || isDevOps(service)) return "External";
    if (isAzurePaaS(service, cloud)) return "External";
    if (isComputeLike(service) || isDataLike(service) || isStorageLike(service) || isNetworkLike(service) || isSecurityLike(service) || isIntegrationLike(service) || isMonitoring(service) || isAnalyticsLike(service) || isAiMlLike(service)) {
      return "Recommended";
    }
    if (isDatabricksLike(service, cloud)) return "Recommended";
    return "External";
  }

  if (kind === "k8s") {
    if (category === "clients" || isGlobalEdge(service) || isIdentity(service) || isDevOps(service)) return "External";
    if (hasAnyCap(service, ["container", "serverless"]) || ["ecs", "eks", "fargate", "aks", "aci", "containerapps", "gke", "cloudrun"].includes(service.id.toLowerCase())) return "Recommended";
    return "External";
  }

  if (kind === "database-layer") {
    if (category === "clients" || isGlobalEdge(service) || isIdentity(service) || isDevOps(service)) return "External";
    if (isDataLike(service) || isStorageLike(service)) {
      return "Recommended";
    }
    return "External";
  }

  return "Allowed";
}

export function classifyBoundaryPlacement(
  kind: BoundaryKind,
  service: PlacementService,
  cloud: CloudId,
): BoundaryPlacement {
  return physicalBoundaryPlacement(kind, service, cloud);
}

export function isBoundaryMember(kind: BoundaryKind, service: PlacementService, cloud: CloudId): boolean {
  return classifyBoundaryPlacement(kind, service, cloud) === "Recommended";
}

export function canNestBoundary(parent: BoundaryKind, child: BoundaryKind): boolean {
  const allowed: Record<BoundaryKind, BoundaryKind[]> = {
    region: ["vpc", "az", "security-zone", "public-subnet", "private-subnet", "service-boundary", "security-boundary", "k8s", "service-group", "database-layer"],
    vpc: ["az", "security-zone", "public-subnet", "private-subnet", "service-boundary", "security-boundary", "k8s", "service-group", "database-layer"],
    az: ["security-zone", "public-subnet", "private-subnet", "service-boundary", "security-boundary", "k8s", "service-group", "database-layer"],
    "security-zone": [],
    "service-boundary": [],
    "security-boundary": [],
    "public-subnet": ["k8s", "service-group"],
    "private-subnet": ["k8s", "service-group", "database-layer"],
    k8s: ["service-group"],
    "service-group": [],
    "database-layer": [],
  };
  return allowed[parent]?.includes(child) ?? false;
}

export function getBoundaryLabel(kind: BoundaryKind, cloud?: CloudId): string {
  if (kind === "vpc") {
    if (cloud === "azure") return "Virtual Network (VNet)";
    if (cloud === "aws") return "VPC";
    return "Virtual Network";
  }

  return kind === "security-boundary"
    ? "Security Boundary"
    : kind === "security-zone"
      ? "Security Zone"
    : kind === "database-layer"
      ? "Database Layer"
      : kind === "service-group"
        ? "Service Group"
        : kind === "service-boundary"
          ? "Service Boundary"
        : kind === "public-subnet"
          ? "Public Subnet"
          : kind === "private-subnet"
            ? "Private Subnet"
            : kind === "az"
              ? "Availability Zone"
              : "Region";
}
