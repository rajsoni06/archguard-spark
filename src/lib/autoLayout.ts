import dagre from "dagre";
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

// ── Node dimensions ──────────────────────────────────────────────────────────
const NODE_W = 176;
const NODE_H = 66;

// ── Spacing constants ────────────────────────────────────────────────────────
// Compact professional spacing — close enough to read flow, not so tight nodes collide.
const RANK_SEP_LR = 80;  // horizontal gap between tiers in LR mode
const RANK_SEP_TB = 70;  // vertical gap between tiers in TB mode
const NODE_SEP_LR = 40;  // vertical gap between nodes in the same tier (LR)
const NODE_SEP_TB = 24;  // horizontal gap between nodes in the same tier (TB) — keep narrow for compact width
const EDGE_SEP = 20;     // edge separation within a rank
const MARGIN = 40;
const BOUNDARY_PAD_OUTER = 48; // outer boundary (region / vpc)
const BOUNDARY_PAD_INNER = 32; // inner boundaries (subnet, az, k8s…)
const ISOLATED_GAP = 100;      // gap between main arch and isolated zone

// ── Capability → logical tier (lower = upstream/entry) ───────────────────────
// This drives both synthesised edges and boundary affinity.
const CAP_TIER: Partial<Record<Capability, number>> = {
  client:           0,
  dns:              1,
  cdn:              2,
  waf:              3,
  "load-balancer":  4,
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
  cache:            8,
  monitoring:       8,
  tracing:          8,
  database:         9,
  nosql:            9,
  "object-storage": 9,
  "block-storage":  9,
  archive:          9,
};

/** Returns the lowest (most upstream) tier for a node's capabilities. */
function tierOf(node: LayoutNode): number {
  let best = 6; // default: compute
  for (const cap of node.caps) {
    const t = CAP_TIER[cap];
    if (t !== undefined && t < best) best = t;
  }
  return best;
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
 * Synthesises a minimal set of hierarchical edges when the user has not drawn
 * any connections. Produces proper fan-out for parallel services at the same
 * tier (e.g. multiple microservices all connected from one gateway, all
 * connected to one database) rather than a single linear chain.
 */
function synthesiseEdges(nodes: LayoutNode[]): { source: string; target: string }[] {
  // Group nodes by tier
  const byTier = new Map<number, LayoutNode[]>();
  nodes.forEach((n) => {
    const t = tierOf(n);
    if (!byTier.has(t)) byTier.set(t, []);
    byTier.get(t)!.push(n);
  });
  const tiers = Array.from(byTier.keys()).sort((a, b) => a - b);

  const synth: { source: string; target: string }[] = [];
  const addEdge = (src: string, tgt: string) => {
    if (src !== tgt && !synth.some((e) => e.source === src && e.target === tgt)) {
      synth.push({ source: src, target: tgt });
    }
  };

  for (let i = 0; i < tiers.length - 1; i++) {
    const from = byTier.get(tiers[i]!)!;
    const to   = byTier.get(tiers[i + 1]!)!;

    if (from.length === 1) {
      // One upstream → all downstream (fan-out)
      to.forEach((t) => addEdge(from[0]!.id, t.id));
    } else if (to.length === 1) {
      // All upstream → one downstream (fan-in)
      from.forEach((f) => addEdge(f.id, to[0]!.id));
    } else if (from.length <= to.length) {
      // Distribute upstream evenly across downstream
      from.forEach((f) => {
        to.forEach((t) => addEdge(f.id, t.id));
      });
    } else {
      // More upstream than downstream: many→many
      to.forEach((t) => {
        from.forEach((f) => addEdge(f.id, t.id));
      });
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
  const connectedIds = new Set<string>();
  existingEdges.forEach((e) => { connectedIds.add(e.source); connectedIds.add(e.target); });
  const hasEdges = existingEdges.length > 0;
  const activeNodes  = hasEdges ? nodes.filter((n) =>  connectedIds.has(n.id)) : nodes;
  const isolatedNodes = hasEdges ? nodes.filter((n) => !connectedIds.has(n.id)) : [];
  const validIds = new Set(activeNodes.map((n) => n.id));

  // ── 2. Resolve edge set ───────────────────────────────────────────────────
  // Use user-drawn edges when available; remove cycles so dagre stays acyclic.
  let layoutEdges: { source: string; target: string }[];
  if (hasEdges) {
    const validEdges = existingEdges.filter(
      (e) => validIds.has(e.source) && validIds.has(e.target),
    );
    layoutEdges = removeCycles(activeNodes, validEdges);
  } else {
    layoutEdges = synthesiseEdges(activeNodes);
  }

  // ── 3. Build dagre graph ──────────────────────────────────────────────────
  const g = new dagre.graphlib.Graph({ multigraph: false });
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: direction === "LR" ? RANK_SEP_LR : RANK_SEP_TB,
    nodesep: direction === "LR" ? NODE_SEP_LR : NODE_SEP_TB,
    edgesep: EDGE_SEP,
    marginx: MARGIN,
    marginy: MARGIN,
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

  // ── 5. Place isolated nodes in a tidy grid OUTSIDE the main architecture ────
  // Isolated nodes are always placed clearly outside boundaries — below for both
  // LR and TB so they never appear inside any boundary container.
  if (isolatedNodes.length > 0) {
    const allPos = Object.values(positions);
    let gridOriginX = MARGIN;
    let gridOriginY = MARGIN + 200;
    if (allPos.length > 0) {
      // Always place isolated nodes below the main architecture for clarity.
      // This ensures they never visually appear inside Region/VPC/AZ boundaries.
      gridOriginX = Math.min(...allPos.map((p) => p.x));
      gridOriginY = Math.max(...allPos.map((p) => p.y + NODE_H)) + ISOLATED_GAP;
    }

    const COLS = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(isolatedNodes.length))));
    const cellW = NODE_W + 40;
    const cellH = NODE_H + 40;
    isolatedNodes.forEach((n, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
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
  sortedBoundaries.forEach((b, idx) => {
    const affinity = BOUNDARY_AFFINITY[b.kind] ?? [];
    // Boundaries ONLY wrap active (connected) nodes — never isolated/disconnected ones.
    // This keeps unused components visually separate from the main architecture.
    const members = activeNodes.filter((n) => {
      if (!positions[n.id]) return false;
      // Ensure this node is truly active (connected), not an isolated stray.
      if (hasEdges && !connectedIds.has(n.id)) return false;
      if (affinity.length === 0) return true; // region / vpc → wrap everything active
      return n.caps.some((c) => affinity.includes(c));
    });

    if (members.length === 0) return;

    const xs = members.map((m) => positions[m.id]!.x);
    const ys = members.map((m) => positions[m.id]!.y);
    const isOuter = (BOUNDARY_DEPTH[b.kind] ?? 6) <= 1;
    const pad = isOuter ? BOUNDARY_PAD_OUTER : BOUNDARY_PAD_INNER + (idx % 3) * 4;

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
  if (hasEdges) {
    existingEdges.forEach((e) => {
      if (validIds.has(e.source) && validIds.has(e.target)) pushEdge(e.source, e.target);
    });
  } else {
    layoutEdges.forEach((e) => pushEdge(e.source, e.target));
  }

  // ── 8. Warnings ───────────────────────────────────────────────────────────
  const warnings: string[] = [];
  const hasCap = (cap: Capability) => nodes.some((n) => n.caps.includes(cap));
  const hasCompute = hasCap("compute") || hasCap("container") || hasCap("serverless");
  const hasEntry   = hasCap("api-gateway") || hasCap("load-balancer") || hasCap("cdn");

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
