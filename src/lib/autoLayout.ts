import type { Capability } from "./catalog";
import type { ProjectContext } from "./ruleEngine";

export interface LayoutNode {
  id: string;
  label: string;
  caps: Capability[];
}

export interface LayoutEdge {
  source: string;
  target: string;
}

export interface LayoutBoundary {
  id: string;
  kind: string;
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

/** Ordered request-flow tiers. Each tier lists the capabilities that belong to it. */
type Tier = { id: string; caps: Capability[] };

const FLOW_TIERS: Tier[] = [
  { id: "client", caps: ["client"] },
  { id: "dns", caps: ["dns"] },
  { id: "edge", caps: ["cdn"] },
  { id: "waf", caps: ["waf"] },
  { id: "lb", caps: ["load-balancer"] },
  { id: "gateway", caps: ["api-gateway"] },
  { id: "compute", caps: ["compute", "container", "serverless"] },
  { id: "messaging", caps: ["queue", "pubsub", "streaming"] },
  { id: "cache", caps: ["cache"] },
  { id: "data", caps: ["database", "nosql", "object-storage", "block-storage", "archive"] },
];

/** Tiers that hang off the main flow rather than sitting inside it. */
const SIDE_TIERS: Tier[] = [
  { id: "identity", caps: ["auth", "secrets", "encryption"] },
  { id: "ops", caps: ["monitoring", "tracing"] },
];

function tiersForPattern(pattern: string): Tier[] {
  const base = FLOW_TIERS.map((t) => ({ ...t }));
  if (pattern === "Event-Driven" || pattern === "CQRS") {
    // Messaging fans out before the compute tier in event-first designs.
    const withoutMsg = base.filter((t) => t.id !== "messaging");
    const idx = withoutMsg.findIndex((t) => t.id === "compute");
    withoutMsg.splice(idx, 0, { id: "messaging", caps: ["queue", "pubsub", "streaming"] });
    return withoutMsg;
  }
  if (pattern === "Serverless") {
    // Serverless designs route through the gateway, not a load balancer.
    return base.filter((t) => t.id !== "lb");
  }
  return base;
}

const COL_W = 250;
const ROW_H = 130;
const NODE_W = 176;
const NODE_H = 66;

/**
 * Which flow tiers each boundary kind is expected to contain, and how deeply
 * it nests (lower depth = outermost container).
 */
const BOUNDARY_SCOPE: Record<string, { tiers: string[]; depth: number }> = {
  region: { tiers: ["*"], depth: 0 },
  vpc: { tiers: ["*"], depth: 1 },
  az: { tiers: ["lb", "gateway", "compute", "messaging", "cache", "data"], depth: 2 },
  "security-boundary": { tiers: ["edge", "waf", "lb", "gateway"], depth: 3 },
  "public-subnet": { tiers: ["edge", "waf", "lb", "gateway"], depth: 4 },
  "private-subnet": { tiers: ["compute", "messaging", "cache"], depth: 4 },
  k8s: { tiers: ["compute"], depth: 5 },
  "service-group": { tiers: ["compute", "messaging"], depth: 5 },
  "database-layer": { tiers: ["data", "cache"], depth: 4 },
};

export function computeAutoLayout(
  nodes: LayoutNode[],
  ctx: ProjectContext,
  boundaryNodes: LayoutBoundary[] = [],
): LayoutResult {
  const tiers = tiersForPattern(ctx.pattern);
  const used = new Set<string>();
  const columns: { tier: Tier; nodes: LayoutNode[] }[] = [];

  for (const tier of tiers) {
    const members = nodes.filter((n) => !used.has(n.id) && n.caps.some((c) => tier.caps.includes(c)));
    members.forEach((m) => used.add(m.id));
    if (members.length) columns.push({ tier, nodes: members });
  }

  const sideGroups = SIDE_TIERS.map((tier) => {
    const members = nodes.filter((n) => !used.has(n.id) && n.caps.some((c) => tier.caps.includes(c)));
    members.forEach((m) => used.add(m.id));
    return { tier, nodes: members };
  }).filter((g) => g.nodes.length > 0);

  const leftovers = nodes.filter((n) => !used.has(n.id));

  const positions: Record<string, { x: number; y: number }> = {};
  const originX = 80;
  const originY = 140;

  columns.forEach((col, ci) => {
    col.nodes.forEach((n, ri) => {
      const offset = ((col.nodes.length - 1) / 2) * ROW_H;
      positions[n.id] = { x: originX + ci * COL_W, y: originY + ri * ROW_H - offset };
    });
  });

  // Side rails: identity above the flow, observability below it.
  sideGroups.forEach((group, gi) => {
    group.nodes.forEach((n, i) => {
      positions[n.id] = {
        x: originX + Math.min(columns.length - 1, 4) * COL_W + i * 180,
        y: gi === 0 ? originY - 230 : originY + 250,
      };
    });
  });

  leftovers.forEach((n, i) => {
    positions[n.id] = { x: originX + i * 200, y: originY + 420 };
  });

  // ---- boundary containers ----
  // Boundaries are groups, not services: size each one to enclose the tiers it
  // owns, padded by nesting depth so outer containers wrap inner ones.
  const tierOf: Record<string, string> = {};
  columns.forEach((col) => col.nodes.forEach((n) => (tierOf[n.id] = col.tier.id)));
  sideGroups.forEach((g) => g.nodes.forEach((n) => (tierOf[n.id] = g.tier.id)));

  const boundaries: Record<string, BoundaryRect> = {};
  const present = [...boundaryNodes].sort(
    (a, b) => (BOUNDARY_SCOPE[a.kind]?.depth ?? 9) - (BOUNDARY_SCOPE[b.kind]?.depth ?? 9),
  );

  present.forEach((b, index) => {
    const scope = BOUNDARY_SCOPE[b.kind] ?? { tiers: ["*"], depth: 6 };
    const members = nodes.filter((n) => {
      const t = tierOf[n.id];
      if (!t) return scope.tiers.includes("*");
      return scope.tiers.includes("*") || scope.tiers.includes(t);
    });
    if (members.length === 0) return;

    const xs = members.map((m) => positions[m.id]!.x);
    const ys = members.map((m) => positions[m.id]!.y);
    // Nested containers shrink inward; identical kinds are offset so duplicates
    // stay distinguishable instead of stacking exactly on top of each other.
    const pad = 74 - Math.min(scope.depth, 5) * 10 + (index % 2) * 4;

    boundaries[b.id] = {
      x: Math.min(...xs) - pad,
      y: Math.min(...ys) - pad,
      width: Math.max(...xs) - Math.min(...xs) + NODE_W + pad * 2,
      height: Math.max(...ys) - Math.min(...ys) + NODE_H + pad * 2,
    };
  });

  // ---- connections ----
  const edges: LayoutEdge[] = [];
  const push = (source: string, target: string) => {
    if (source !== target && !edges.some((e) => e.source === source && e.target === target)) {
      edges.push({ source, target });
    }
  };

  for (let i = 0; i < columns.length - 1; i++) {
    const from = columns[i]!;
    const to = columns[i + 1]!;
    // Fan-out only where it is meaningful: single upstream → all downstream,
    // otherwise pair them up so the diagram stays readable.
    if (from.nodes.length === 1) {
      to.nodes.forEach((t) => push(from.nodes[0]!.id, t.id));
    } else if (to.nodes.length === 1) {
      from.nodes.forEach((f) => push(f.id, to.nodes[0]!.id));
    } else {
      from.nodes.forEach((f, idx) => push(f.id, (to.nodes[idx] ?? to.nodes[0]!).id));
    }
  }

  const computeCol = columns.find((c) => c.tier.id === "compute");
  const gatewayCol = columns.find((c) => c.tier.id === "gateway") ?? columns.find((c) => c.tier.id === "lb");

  for (const group of sideGroups) {
    for (const n of group.nodes) {
      if (group.tier.id === "identity") {
        const anchor = gatewayCol ?? computeCol;
        anchor?.nodes.forEach((a) => push(n.id, a.id));
      } else {
        computeCol?.nodes.forEach((a) => push(a.id, n.id));
      }
    }
  }

  // Cache should also be readable directly by compute when both exist.
  const cacheCol = columns.find((c) => c.tier.id === "cache");
  if (cacheCol && computeCol) {
    computeCol.nodes.forEach((c) => cacheCol.nodes.forEach((k) => push(c.id, k.id)));
  }

  // ---- validation ----
  const warnings: string[] = [];
  const hasCap = (cap: Capability) => nodes.some((n) => n.caps.includes(cap));
  const entry = hasCap("api-gateway") || hasCap("load-balancer") || hasCap("cdn");
  if (computeCol && !entry) {
    warnings.push(
      "These components cannot form a complete request flow. Consider adding an API Gateway or Load Balancer in front of your services.",
    );
  }
  if (!computeCol && columns.some((c) => c.tier.id === "data")) {
    warnings.push("There is a data tier with no compute tier — add a backend service between the entry point and the database.");
  }
  if (leftovers.length) {
    warnings.push(
      `${leftovers.map((l) => l.label).join(", ")} could not be placed in the request flow and were parked below the diagram.`,
    );
  }
  if (nodes.length < 3) {
    warnings.push("Add at least three components so Auto Layout can infer a meaningful flow.");
  }

  const summary = columns.map((c) => c.nodes.map((n) => n.label).join(" / ")).join(" → ");

  return { positions, edges, warnings, summary };
}
