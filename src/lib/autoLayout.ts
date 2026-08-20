import dagre from "dagre";
import type { BoundaryKind, Capability, CloudId } from "./catalog";
import { canNestBoundary, classifyBoundaryPlacement } from "./boundaryPolicy";
import type { ProjectContext } from "./ruleEngine";

export interface LayoutNode {
  id: string;
  serviceId?: string;
  label: string;
  category?: string;
  cloud?: CloudId;
  caps: Capability[];
}

export interface LayoutEdge {
  source: string;
  target: string;
}

export interface LayoutBoundary {
  id: string;
  kind: BoundaryKind;
}

export interface BoundaryRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  positions: Record<string, { x: number; y: number }>;
  edges: LayoutEdge[];
  /** Container rectangles for boundary nodes, keyed by node id. */
  boundaries: Record<string, BoundaryRect>;
  warnings: string[];
  summary: string;
}

// ── Node dimensions ──────────────────────────────────────────────────────────
const NODE_W = 176;
const NODE_H = 66;

// ── Spacing constants ────────────────────────────────────────────────────────
// Compact professional spacing — close enough to read flow, not so tight nodes collide.
const RANK_SEP_LR = 58;  // horizontal gap between tiers in LR mode
const RANK_SEP_TB = 70;  // vertical gap between tiers in TB mode
const NODE_SEP_LR = 40;  // vertical gap between nodes in the same tier (LR)
const NODE_SEP_TB = 24;  // horizontal gap between nodes in the same tier (TB) — keep narrow for compact width
const EDGE_SEP = 28;     // minimum separation between parallel edge lanes
const MARGIN = 40;
const BOUNDARY_PAD_OUTER = 48; // outer boundary (region / vpc)
const BOUNDARY_PAD_INNER = 32; // inner boundaries (subnet, az, k8s…)
const ISOLATED_GAP = 100;      // gap between main arch and isolated zone
const COMPACT_RANK_SEP_LR = 36;
const COMPACT_RANK_SEP_TB = 52;
const COMPACT_NODE_SEP_LR = 38;
const COMPACT_NODE_SEP_TB = 28;
const COMPACT_MARGIN = 28;
const COMPACT_BOUNDARY_OUTER = 32;
const COMPACT_BOUNDARY_INNER = 18;
const COMPACT_ISOLATED_GAP = 64;

// ── Capability → logical tier (lower = upstream/entry) ───────────────────────
// This drives both synthesised edges and boundary affinity.
const CAP_TIER: Partial<Record<Capability, number>> = {
  client:           0,
  dns:              1,
  cdn:              2,
  waf:              3,
  "load-balancer":  4,
  "reverse-proxy":  4,
  "api-gateway":    4,
  auth:             5,
  secrets:          5,
  encryption:       5,
  network:          5,
  "private-network":5,
  compute:          6,
  container:        6,
  serverless:       6,
  queue:            7,
  pubsub:           7,
  streaming:        7,
  "event-bus":      7,
  etl:              8,
  cache:            8,
  monitoring:       8,
  tracing:          8,
  database:         9,
  sql:              9,
  nosql:            9,
  warehouse:        9,
  search:           9,
  "data-lake":      9,
  "data-catalog":   9,
  bi:               10,
  ml:               9,
  "object-storage": 9,
  "block-storage":  9,
  archive:          9,
};

/** Returns the lowest (most upstream) tier for a node's capabilities. */
function tierOf(node: LayoutNode): number {
  const category = node.category?.trim().toLowerCase();
  if (category === "clients") return -2;
  if (category === "devops") return -1;

  let best = 6; // default: compute
  for (const cap of node.caps) {
    const t = CAP_TIER[cap];
    if (t !== undefined && t < best) best = t;
  }
  return best;
}

function categoryOf(node: LayoutNode): string {
  return node.category?.trim().toLowerCase() ?? "";
}

function hasCapability(node: LayoutNode, ...caps: Capability[]): boolean {
  return caps.some((cap) => node.caps.includes(cap));
}

function isObservabilityNode(node: LayoutNode): boolean {
  return categoryOf(node) === "monitoring" || hasCapability(node, "monitoring", "tracing");
}

function isDevOpsNode(node: LayoutNode): boolean {
  return categoryOf(node) === "devops";
}

function isDataSink(node: LayoutNode): boolean {
  return hasCapability(node, "database", "managed-database", "sql", "nosql", "warehouse", "search", "object-storage", "block-storage", "archive", "cache", "data-lake");
}

function isComputeNode(node: LayoutNode): boolean {
  return categoryOf(node) === "compute" || hasCapability(node, "compute", "container", "serverless");
}

function isIntegrationNode(node: LayoutNode): boolean {
  return categoryOf(node) === "integration" || hasCapability(node, "queue", "pubsub", "streaming");
}

function isAnalyticsNode(node: LayoutNode): boolean {
  const category = categoryOf(node);
  return category === "analytics" || category === "ai / ml";
}

type FlowRole =
  | "client"
  | "edge"
  | "identity"
  | "compute"
  | "integration"
  | "data"
  | "analytics"
  | "observability"
  | "devops"
  | "other";

function flowRole(node: LayoutNode): FlowRole {
  if (categoryOf(node) === "clients" || hasCapability(node, "client")) return "client";
  if (isDevOpsNode(node)) return "devops";
  if (isObservabilityNode(node)) return "observability";
  if (hasCapability(node, "dns", "cdn", "waf", "load-balancer", "api-gateway")) return "edge";
  if (hasCapability(node, "auth")) return "identity";
  if (isIntegrationNode(node)) return "integration";
  if (isComputeNode(node)) return "compute";
  if (isDataSink(node)) return "data";
  if (isAnalyticsNode(node)) return "analytics";
  return "other";
}

function flowRank(node: LayoutNode): number {
  switch (flowRole(node)) {
    case "client":
      return 0;
    case "edge":
      return 1;
    case "identity":
      return 2;
    case "compute":
      return 3;
    case "integration":
      return 4;
    case "data":
      return 5;
    case "analytics":
      return 6;
    case "observability":
      return 7;
    case "devops":
      return 8;
    default:
      return 9;
  }
}

function cloudRank(cloud?: CloudId): number {
  if (cloud === "aws") return 0;
  if (cloud === "azure") return 1;
  if (cloud === "gcp") return 2;
  return 3;
}

function sortForFlow(nodes: LayoutNode[], ctx: ProjectContext): LayoutNode[] {
  return [...nodes].sort((a, b) => {
    const aCloud = a.cloud ?? ctx.cloud;
    const bCloud = b.cloud ?? ctx.cloud;
    return (
      cloudRank(aCloud) - cloudRank(bCloud) ||
      flowRank(a) - flowRank(b) ||
      categoryOf(a).localeCompare(categoryOf(b)) ||
      (a.label || a.id).localeCompare(b.label || b.id)
    );
  });
}

/** Reject only clearly backwards relationships; valid user edges remain intact. */
function isLogicalEdge(source: LayoutNode, target: LayoutNode): boolean {
  if (source.id === target.id) return false;
  if (categoryOf(target) === "clients") return false;
  if (isObservabilityNode(source)) return false;

  const s = flowRole(source);
  const t = flowRole(target);

  // Replicas and peer services are legitimate relationships in HA and
  // multi-service designs. Keep explicit same-tier links when they do not
  // point backwards into the client or observability sink.
  if (s === t && ["edge", "identity", "compute", "integration", "data", "analytics", "devops", "other"].includes(s)) {
    return true;
  }

  if (s === "devops") return t === "edge" || t === "identity" || t === "compute" || t === "integration" || t === "data" || t === "analytics";
  if (s === "client") return t === "edge" || t === "identity" || t === "compute" || t === "integration";
  if (s === "edge") return t === "identity" || t === "compute" || t === "integration" || t === "data";
  if (s === "identity") return t === "compute" || t === "integration" || t === "data";
  if (s === "compute") return t === "integration" || t === "data" || t === "analytics" || t === "observability";
  if (s === "integration") return t === "compute" || t === "data" || t === "analytics" || t === "observability";
  if (s === "data") return t === "analytics" || t === "observability";
  if (s === "analytics") return t === "observability";
  return false;
}

// ── Boundary depth (outer → inner nesting order) ─────────────────────────────
const BOUNDARY_DEPTH: Record<string, number> = {
  region:            0,
  vpc:               1,
  az:                2,
  "security-boundary": 3,
  "public-subnet":   4,
  "private-subnet":  4,
  "database-layer":  4,
  k8s:               5,
  "service-group":   5,
};

// Capabilities that "belong" inside each boundary kind.
// Empty array ⇒ boundary wraps ALL active nodes (region, vpc).
const BOUNDARY_AFFINITY: Record<string, Capability[]> = {
  region:              [],
  vpc:                 [],
  az:                  ["load-balancer","api-gateway","auth","compute","container","serverless","queue","pubsub","streaming","cache","database","nosql"],
  "security-boundary": ["cdn","waf","load-balancer","api-gateway"],
  "public-subnet":     ["cdn","waf","load-balancer","api-gateway"],
  "private-subnet":    ["compute","container","serverless","queue","pubsub","streaming","cache"],
  "database-layer":    ["database","nosql","object-storage","block-storage","archive","cache"],
  k8s:                 ["compute","container","serverless"],
  "service-group":     ["compute","container","serverless","queue","pubsub","streaming"],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Remove cycles in the user-drawn edge set using a simple DFS. */
function removeCycles(
  nodes: LayoutNode[],
  edges: { source: string; target: string }[],
): { source: string; target: string }[] {
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => adj.get(e.source)?.push(e.target));

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  nodes.forEach((n) => color.set(n.id, WHITE));

  const backEdgeSet = new Set<string>();

  function dfs(u: string) {
    color.set(u, GRAY);
    for (const v of adj.get(u) ?? []) {
      if (color.get(v) === GRAY) {
        backEdgeSet.add(`${u}→${v}`);
      } else if (color.get(v) === WHITE) {
        dfs(v);
      }
    }
    color.set(u, BLACK);
  }
  nodes.forEach((n) => { if (color.get(n.id) === WHITE) dfs(n.id); });

  return edges.filter((e) => !backEdgeSet.has(`${e.source}→${e.target}`));
}

/**
 * Synthesises a compact dependency graph from the services on the canvas.
 * Runtime traffic, deployment, and observability are kept in separate lanes so
 * the diagram reads as a cloud architecture instead of a rotated chain.
 */
function synthesiseEdges(
  nodes: LayoutNode[],
  ctx: ProjectContext,
): { source: string; target: string }[] {
  const synth: { source: string; target: string }[] = [];
  const addEdge = (src: string, tgt: string) => {
    if (src !== tgt && !synth.some((e) => e.source === src && e.target === tgt)) {
      synth.push({ source: src, target: tgt });
    }
  };

  const ordered = sortForFlow(nodes, ctx);
  const byRole = new Map<FlowRole, LayoutNode[]>();
  ordered.forEach((node) => {
    const role = flowRole(node);
    if (!byRole.has(role)) byRole.set(role, []);
    byRole.get(role)!.push(node);
  });

  // Connect sources to the nearest semantic tier. A single gateway/client may
  // fan out to replicas, but a group of sources is matched instead of being
  // connected to every target. This prevents artificial all-to-all traffic.
  const connectLayer = (sources: LayoutNode[], targets: LayoutNode[], fanOut = 1) => {
    if (sources.length === 0 || targets.length === 0) return;
    const srcs = sortForFlow(sources, ctx);
    const tgts = sortForFlow(targets, ctx);
    srcs.forEach((source, sourceIndex) => {
      const sameCloud = tgts.filter((target) => (target.cloud ?? ctx.cloud) === (source.cloud ?? ctx.cloud));
      const pool = sameCloud.length > 0 ? sameCloud : tgts;
      const count = Math.min(pool.length, sources.length === 1 ? Math.max(1, fanOut) : 1);
      for (let offset = 0; offset < count; offset++) {
        const target = pool[(sourceIndex + offset) % pool.length]!;
        if (isLogicalEdge(source, target)) addEdge(source.id, target.id);
      }
    });
  };

  const clients = byRole.get("client") ?? [];
  const edges = byRole.get("edge") ?? [];
  const identities = byRole.get("identity") ?? [];
  const computes = byRole.get("compute") ?? [];
  const integrations = byRole.get("integration") ?? [];
  const data = byRole.get("data") ?? [];
  const analytics = byRole.get("analytics") ?? [];
  const observability = byRole.get("observability") ?? [];
  const devops = byRole.get("devops") ?? [];
  const otherRuntime = byRole.get("other") ?? [];

  if (clients.length > 0) {
    connectLayer(clients, edges.length > 0 ? edges : [...identities, ...computes, ...integrations], 3);
  }

  const clouds = Array.from(new Set(ordered.map((n) => n.cloud ?? ctx.cloud))).sort(
    (a, b) => cloudRank(a as CloudId) - cloudRank(b as CloudId),
  );

  const byCloudAndRole = (cloud: CloudId | string, roles: FlowRole[]) =>
    ordered.filter((node) => (node.cloud ?? ctx.cloud) === cloud && roles.includes(flowRole(node)));

  clouds.forEach((cloud) => {
    const cloudEdges = byCloudAndRole(cloud, ["edge"]);
    const cloudIdentities = byCloudAndRole(cloud, ["identity"]);
    const cloudComputes = byCloudAndRole(cloud, ["compute"]);
    const cloudIntegrations = byCloudAndRole(cloud, ["integration"]);
    const cloudData = byCloudAndRole(cloud, ["data"]);
    const cloudAnalytics = byCloudAndRole(cloud, ["analytics"]);
    const cloudObs = byCloudAndRole(cloud, ["observability"]);
    const cloudDevops = byCloudAndRole(cloud, ["devops"]);
    const cloudOther = byCloudAndRole(cloud, ["other"]);

    const runtime = [...cloudComputes, ...cloudIntegrations];
    const persistence = [...cloudData, ...cloudAnalytics];

    // Entry and identity tiers feed the closest application tier. If there
    // are multiple compute replicas, one gateway can legitimately fan out.
    connectLayer(cloudEdges, cloudIdentities.length > 0 ? cloudIdentities : runtime, 3);
    connectLayer(cloudIdentities, runtime, 2);

    // Compute may publish to messaging and persist state, but it should not be
    // wired to every downstream service. Prefer messaging as the branch and
    // data as the direct persistence path when no integration tier exists.
    connectLayer(cloudComputes, cloudIntegrations.length > 0 ? cloudIntegrations : cloudData, 3);
    if (cloudIntegrations.length === 0) connectLayer(cloudComputes, cloudAnalytics, 2);
    connectLayer(cloudIntegrations, cloudComputes.length > 0 ? cloudData : persistence, 2);
    connectLayer(cloudIntegrations, cloudData.length > 0 ? cloudData : cloudAnalytics, 2);
    connectLayer(cloudData, cloudAnalytics, 2);

    // Observability is a side branch, not part of the request path.
    connectLayer(runtime.length > 0 ? runtime : [...cloudData, ...cloudAnalytics], cloudObs, 2);
    connectLayer(cloudDevops, cloudComputes.length > 0 ? cloudComputes : runtime, 2);
    connectLayer(cloudOther, cloudComputes.length > 0 ? cloudComputes : persistence, 2);
  });

  if (observability.length > 0) {
    connectLayer([...computes, ...integrations, ...data, ...analytics], observability, 2);
  }

  if (devops.length > 0 && computes.length === 0 && integrations.length === 0 && data.length === 0 && analytics.length === 0) {
    connectLayer(devops, otherRuntime, 2);
  }

  if (ordered.length > 1 && synth.length === 0 && ordered.every((node) => flowRole(node) === "compute")) {
    for (let i = 0; i < ordered.length - 1; i++) {
      addEdge(ordered[i]!.id, ordered[i + 1]!.id);
    }
  }

  return synth;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Professional hierarchical layout engine.
 *
 * Priority order (highest → lowest):
 *   1. Logical hierarchy and dependency flow
 *   2. No overlapping / collisions
 *   3. Minimal edge crossings (dagre network-simplex)
 *   4. Shortest practical connection paths
 *   5. Balanced spacing
 *   6. Overall readability
 */
export function computeAutoLayout(
  nodes: LayoutNode[],
  ctx: ProjectContext,
  boundaryNodes: LayoutBoundary[] = [],
  existingEdges: { source: string; target: string }[] = [],
  direction: "LR" | "TB" = "LR",
): LayoutResult {
  if (nodes.length === 0) {
    return { positions: {}, edges: [], boundaries: {}, warnings: [], summary: "" };
  }

  // ── 1. Classify active vs isolated nodes ─────────────────────────────────
  const activeNodes = nodes;
  let isolatedNodes: LayoutNode[] = [];
  const validIds = new Set(activeNodes.map((n) => n.id));

  // ── 2. Resolve edge set ───────────────────────────────────────────────────
  // Merge user-drawn edges with inferred flow edges so partial diagrams still
  // produce a complete layout and a connected service graph.
  let layoutEdges: { source: string; target: string }[];
  const mergedEdges = [...existingEdges];
  const seen = new Set(mergedEdges.map((e) => `${e.source}→${e.target}`));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const existingValidEdges = existingEdges.filter((e) => {
    const source = nodeById.get(e.source);
    const target = nodeById.get(e.target);
    return Boolean(source && target && isLogicalEdge(source, target));
  });
  const explicitlyConnected = new Set<string>();
  existingValidEdges.forEach((e) => {
    explicitlyConnected.add(e.source);
    explicitlyConnected.add(e.target);
  });

  // A complete user graph is authoritative. Inference is limited to edges
  // touching an unconnected service, which fills gaps without creating long
  // parallel routes around relationships the user already defined.
  synthesiseEdges(nodes, ctx)
    .filter((e) => !explicitlyConnected.has(e.source) || !explicitlyConnected.has(e.target))
    .forEach((e) => {
    const key = `${e.source}→${e.target}`;
    if (!seen.has(key)) {
      seen.add(key);
      mergedEdges.push(e);
    }
    });
  const validEdges = mergedEdges.filter((e) => {
    const source = nodeById.get(e.source);
    const target = nodeById.get(e.target);
    return Boolean(source && target && validIds.has(e.source) && validIds.has(e.target) && isLogicalEdge(source, target));
  });
  layoutEdges = removeCycles(activeNodes, validEdges);
  const connectedIds = new Set<string>();
  layoutEdges.forEach((e) => {
    connectedIds.add(e.source);
    connectedIds.add(e.target);
  });
  isolatedNodes = nodes.filter((n) => !connectedIds.has(n.id));

  // ── 3. Build dagre graph ──────────────────────────────────────────────────
  const g = new dagre.graphlib.Graph({ multigraph: false });
  g.setDefaultEdgeLabel(() => ({}));
  // Keep large LR diagrams from becoming a long ribbon. Dagre still keeps
  // rank order intact, while its node separation distributes branches across
  // additional rows inside each rank.
  // Keep LR ranks close. Nodes in the same rank are vertically stacked by
  // dagre, so reducing rank separation is the safest way to avoid a long
  // ribbon without sacrificing the left-to-right dependency direction.
  const lrRankSep = Math.max(16, Math.min(28, 42 - Math.ceil(activeNodes.length / 3)));
  g.setGraph({
    rankdir: direction,
    ranksep: direction === "LR" ? lrRankSep : COMPACT_RANK_SEP_TB,
    nodesep: direction === "LR" ? COMPACT_NODE_SEP_LR : COMPACT_NODE_SEP_TB,
    edgesep: EDGE_SEP,
    marginx: COMPACT_MARGIN,
    marginy: COMPACT_MARGIN,
    // network-simplex minimises edge crossings; longest-path is faster but
    // produces more crossings. We prefer quality over speed.
    ranker: "network-simplex",
    acyclicer: "greedy",
  });

  // Use 0 extra padding on node dimensions — the nodesep constant handles spacing.
  activeNodes.forEach((n) => g.setNode(n.id, { width: NODE_W + 8, height: NODE_H + 4, label: n.label }));
  layoutEdges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  // ── 4. Extract node positions (dagre gives centre; ReactFlow wants top-left)
  const positions: Record<string, { x: number; y: number }> = {};
  activeNodes.forEach((n) => {
    const nd = g.node(n.id);
    if (nd) {
      positions[n.id] = {
        x: Math.round(nd.x - NODE_W / 2),
        y: Math.round(nd.y - NODE_H / 2),
      };
    }
  });

  if (direction === "LR") {
    // Dagre can leave large empty gaps when a graph has sparse ranks. Repack
    // the rank columns to a small, consistent gap while preserving their
    // order; nodes within a column retain dagre's vertical stacking.
    const columns = Array.from(
      new Set(activeNodes.map((node) => Math.round((positions[node.id]?.x ?? 0) / 8) * 8)),
    ).sort((a, b) => a - b);
    const columnIndex = new Map(columns.map((column, index) => [column, index]));
    const compactGap = 18;
    activeNodes.forEach((node) => {
      const position = positions[node.id];
      if (!position) return;
      const originalColumn = Math.round(position.x / 8) * 8;
      const index = columnIndex.get(originalColumn);
      if (index == null) return;
      position.x = Math.round(COMPACT_MARGIN + index * (NODE_W + compactGap));
    });
  }

  // ── 5. Place isolated nodes in a tidy grid OUTSIDE the main architecture ────
  // Place isolated nodes outside the main flow while preserving the selected
  // direction: below for TB and to the right for LR.
  if (isolatedNodes.length > 0) {
    const allPos = Object.values(positions);
    let gridOriginX = COMPACT_MARGIN;
    let gridOriginY = COMPACT_MARGIN + 160;
    if (allPos.length > 0) {
      if (direction === "LR") {
        gridOriginX = Math.max(...allPos.map((p) => p.x + NODE_W)) + COMPACT_ISOLATED_GAP;
        gridOriginY = Math.min(...allPos.map((p) => p.y));
      } else {
        gridOriginX = Math.min(...allPos.map((p) => p.x));
        gridOriginY = Math.max(...allPos.map((p) => p.y + NODE_H)) + COMPACT_ISOLATED_GAP;
      }
    }

    const COLS = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(isolatedNodes.length))));
    const cellW = NODE_W + 28;
    const cellH = NODE_H + 28;
    isolatedNodes.forEach((n, i) => {
      const col = direction === "LR" ? Math.floor(i / COLS) : i % COLS;
      const row = direction === "LR" ? i % COLS : Math.floor(i / COLS);
      positions[n.id] = {
        x: Math.round(gridOriginX + col * cellW),
        y: Math.round(gridOriginY + row * cellH),
      };
    });
  }

  // ── 6. Compute boundary rectangles ───────────────────────────────────────
  // Sort outermost-first so each boundary wraps only its immediate children.
  const sortedBoundaries = [...boundaryNodes].sort(
    (a, b) => (BOUNDARY_DEPTH[a.kind] ?? 6) - (BOUNDARY_DEPTH[b.kind] ?? 6),
  );

  const boundaries: Record<string, BoundaryRect> = {};
  const azBoundaries = sortedBoundaries.filter((boundary) => boundary.kind === "az");
  sortedBoundaries.forEach((b, idx) => {
    // Boundaries ONLY wrap active (connected) nodes — never isolated/disconnected ones.
    // This keeps unused components visually separate from the main architecture.
    const members = activeNodes.filter((n, nodeIndex) => {
      if (!positions[n.id] || isolatedNodes.some((isolated) => isolated.id === n.id)) return false;
      const cloud = n.cloud ?? ctx.cloud;
      const placement = classifyBoundaryPlacement(
        b.kind,
        { id: n.serviceId ?? n.id, category: n.category ?? "", caps: n.caps },
        cloud,
      );
      if (placement !== "Recommended") return false;

      // Multiple AZ containers represent a replicated deployment surface. Give
      // each eligible service a stable home AZ so the containers do not stack
      // on top of one another or imply that every service exists in one giant
      // undifferentiated zone.
      if (b.kind === "az" && azBoundaries.length > 1) {
        return nodeIndex % azBoundaries.length === azBoundaries.indexOf(b);
      }
      return true;
    });

    if (members.length === 0) return;

    const xs = members.map((m) => positions[m.id]!.x);
    const ys = members.map((m) => positions[m.id]!.y);
    const isOuter = (BOUNDARY_DEPTH[b.kind] ?? 6) <= 1;
    const pad = isOuter ? COMPACT_BOUNDARY_OUTER : COMPACT_BOUNDARY_INNER + (idx % 2) * 2;

    boundaries[b.id] = {
      x:      Math.round(Math.min(...xs) - pad),
      y:      Math.round(Math.min(...ys) - pad),
      width:  Math.round(Math.max(...xs) - Math.min(...xs) + NODE_W + pad * 2),
      height: Math.round(Math.max(...ys) - Math.min(...ys) + NODE_H + pad * 2),
    };
  });

  // ── 7. Build result edges ─────────────────────────────────────────────────
  const resultEdges: LayoutEdge[] = [];
  const pushEdge = (src: string, tgt: string) => {
    if (src !== tgt && !resultEdges.some((e) => e.source === src && e.target === tgt)) {
      resultEdges.push({ source: src, target: tgt });
    }
  };
  layoutEdges.forEach((e) => pushEdge(e.source, e.target));

  // ── 8. Warnings ───────────────────────────────────────────────────────────
  const warnings: string[] = [];
  const hasCap = (cap: Capability) => nodes.some((n) => n.caps.includes(cap));
  const hasCompute = hasCap("compute") || hasCap("container") || hasCap("serverless");
  const hasEntry   = hasCap("api-gateway") || hasCap("load-balancer") || hasCap("cdn");

  const rejectedEdgeCount = mergedEdges.length - validEdges.length;
  if (rejectedEdgeCount > 0) {
    warnings.push(
      `${rejectedEdgeCount} invalid backwards relationship${rejectedEdgeCount === 1 ? " was" : "s were"} excluded from the generated flow.`,
    );
  }

  if (hasCompute && !hasEntry) {
    warnings.push("No entry point detected. Consider adding an API Gateway or Load Balancer.");
  }
  if (!hasCompute && (hasCap("database") || hasCap("nosql"))) {
    warnings.push("Data tier with no compute tier — add a backend service between entry and database.");
  }
  if (isolatedNodes.length > 0) {
    const names = isolatedNodes.map((n) => n.label).join(", ");
    warnings.push(
      `${names} ${isolatedNodes.length === 1 ? "is" : "are"} not connected and ${isolatedNodes.length === 1 ? "was" : "were"} placed outside the main diagram.`,
    );
  }
  if (nodes.length < 2) {
    warnings.push("Add at least two components so Auto Layout can infer a meaningful flow.");
  }

  // ── 9. Human-readable summary ─────────────────────────────────────────────
  const arrow = direction === "LR" ? " → " : " ↓ ";
  const sortAxis = (id: string) => {
    const p = positions[id];
    return direction === "LR" ? (p?.x ?? 0) : (p?.y ?? 0);
  };
  const BUCKET = direction === "LR" ? RANK_SEP_LR : RANK_SEP_TB;
  const buckets = new Map<number, string[]>();
  activeNodes.forEach((n) => {
    const slot = Math.round(sortAxis(n.id) / BUCKET);
    if (!buckets.has(slot)) buckets.set(slot, []);
    buckets.get(slot)!.push(n.label);
  });
  const summary = Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, labels]) => labels.join(" / "))
    .join(arrow);

  return { positions, edges: resultEdges, boundaries, warnings, summary };
}
