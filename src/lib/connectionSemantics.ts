import type { Capability } from "./catalog";

export const CONNECTION_TYPES = [
  "HTTPS",
  "HTTP",
  "TCP",
  "UDP",
  "WebSocket",
  "SQL / Database Connection",
  "Event",
  "Message",
  "Replication",
  "Data Flow",
  "API Call",
  "gRPC",
] as const;

export type ConnectionType = (typeof CONNECTION_TYPES)[number];

/** Returns a user-facing reason when a relationship is structurally invalid. */
export function connectionValidationError(sourceCaps: Capability[], targetCaps: Capability[]) {
  const sourceIsStorage = sourceCaps.includes("block-storage");
  const targetIsStorage = targetCaps.includes("block-storage");
  const sourceIsAi = sourceCaps.includes("ai");
  const targetIsAi = targetCaps.includes("ai");
  const sourceIsServerless = sourceCaps.includes("serverless");
  const targetIsServerless = targetCaps.includes("serverless");
  const sourceIsContainer = sourceCaps.includes("container");
  const targetIsContainer = targetCaps.includes("container");

  if ((sourceIsStorage && targetIsAi) || (targetIsStorage && sourceIsAi)) {
    return "Connect storage to an application or worker first; a disk should not call an AI service directly.";
  }
  if ((sourceIsStorage && targetIsServerless && !targetIsContainer) ||
      (targetIsStorage && sourceIsServerless && !sourceIsContainer)) {
    return "Block storage should attach to compute or a container workload; use object storage for serverless file access.";
  }

  const sourceIsApi = sourceCaps.includes("api-gateway");
  const targetIsApi = targetCaps.includes("api-gateway");
  const sourceIsAnalytics = sourceCaps.includes("analytics");
  const targetIsAnalytics = targetCaps.includes("analytics");
  if ((sourceIsApi && targetIsAnalytics) || (targetIsApi && sourceIsAnalytics)) {
    return "Route API traffic through an application service and queue or event pipeline before analytics processing.";
  }
  return null;
}

export function inferConnectionType(sourceCaps: Capability[], targetCaps: Capability[]): ConnectionType {
  if (sourceCaps.includes("database") && targetCaps.includes("database")) return "Replication";
  if (targetCaps.includes("database")) return "SQL / Database Connection";
  if (sourceCaps.includes("streaming") || targetCaps.includes("streaming")) return "Data Flow";
  if (sourceCaps.includes("queue") || sourceCaps.includes("pubsub") || targetCaps.includes("queue") || targetCaps.includes("pubsub")) return "Message";
  if (sourceCaps.includes("client") || sourceCaps.includes("cdn") || sourceCaps.includes("load-balancer")) return "HTTPS";
  if (targetCaps.includes("api-gateway")) return "HTTPS";
  return "API Call";
}

export function normalizeConnectionType(value: unknown, sourceCaps: Capability[] = [], targetCaps: Capability[] = []): ConnectionType {
  return typeof value === "string" && (CONNECTION_TYPES as readonly string[]).includes(value)
    ? value as ConnectionType
    : inferConnectionType(sourceCaps, targetCaps);
}
