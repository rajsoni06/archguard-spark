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
