"use client";

import {
  Background,
  BackgroundVariant,
  BaseEdge,
  EdgeLabelRenderer,
  Controls,
  applyNodeChanges,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Maximize2,
  MousePointer2,
  Move,
  Redo2,
  Save,
  Scan,
  Share2,
  Download,
  Settings2,
  Sparkles,
  Type as TypeIcon,
  Undo2,
  Wand2,
  FilePlus2,
  ZoomIn,
  ZoomOut,
  Lock,
  Unlock,
  BoxSelect,
  ZapOff,
  Moon,
  Sun,
  ArrowDown,
  ArrowRight,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BOUNDARY_KINDS, findService, getBoundaryLabel, type CloudId } from "@/lib/catalog";
import { analyzeArchitecture, type AnalysisResult, type ProjectContext, type ArchGraph } from "@/lib/ruleEngine";
import { computeAutoLayout } from "@/lib/autoLayout";
import { normalizeBoundaryLayout, rectForNode, inflateRect, rectContainsRect, type DiagramNodeLike } from "@/lib/boundaryGeometry";
import { estimateCost } from "@/lib/costEngine";
import { loadGraph, saveGraph, shouldSaveGraphOnUnmount } from "@/lib/session";
import { BoundaryNode, DELETE_NODE_EVENT, ServiceNode, TextNode, type CanvasProblem } from "./nodes";
import { ComponentLibrary, type LibraryPayload } from "./ComponentLibrary";
import { ReviewPanel } from "./ReviewPanel";
import { FloatingAiReviewer } from "./FloatingAiReviewer";
import { FailureSimulator } from "./FailureSimulator";
import { TradeoffCard } from "./TradeoffCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CONNECTION_TYPES, connectionValidationError, inferConnectionType, normalizeConnectionType, type ConnectionType } from "@/lib/connectionSemantics";

const nodeTypes = { service: ServiceNode, boundary: BoundaryNode, text: TextNode };

let idCounter = 0;
const nextId = () => `n${++idCounter}_${Date.now().toString(36)}`;

const NODE_W = 176;
const NODE_H = 66;
const GAP = 42;
const MIN_REVIEW_W = 300;
const CANVAS_NODE_Z_INDEX = 1;
const PROBLEM_NODE_Z_INDEX = 2147483647;
const MAX_REVIEW_W = 620;
const CANVAS_THEME_STORAGE_KEY = "archguard-canvas-theme";
const CANVAS_THEME_EVENT = "archguard:canvas-theme-change";
const CANVAS_LOCK_STORAGE_KEY = "archguard-canvas-locked";
type CanvasTheme = "light" | "dark";

const CANVAS_THEMES: Record<CanvasTheme, { canvas: string; grid: string; overlay: string }> = {
  light: {
    canvas: "oklch(0.985 0.003 250)",
    grid: "oklch(0.9 0.006 250)",
    overlay: "linear-gradient(180deg, color-mix(in oklab, white 78%, transparent), transparent)",
  },
  dark: {
    canvas: "oklch(0.165 0.014 258)",
    grid: "oklch(0.38 0.015 258)",
    overlay: "linear-gradient(180deg, color-mix(in oklab, black 22%, transparent), transparent)",
  },
};

// A compact, theme-safe palette makes nearby relationships distinguishable
// without changing the established service/node colors.
const CONNECTION_COLORS = [
  "#2563eb",
  "#0891b2",
  "#059669",
  "#d97706",
  "#db2777",
  "#7c3aed",
  "#dc2626",
  "#0f766e",
  "#4f46e5",
  "#c2410c",
];

const connectionColor = (index: number) => CONNECTION_COLORS[index % CONNECTION_COLORS.length]!;

type RoutePoint = { x: number; y: number };
type RouteObstacle = { x: number; y: number; width: number; height: number };

function compactRoutePoints(points: RoutePoint[]) {
  const compact: RoutePoint[] = [];
  points.forEach((point) => {
    const previous = compact[compact.length - 1];
    if (previous && previous.x === point.x && previous.y === point.y) return;
    const beforePrevious = compact[compact.length - 2];
    if (
      beforePrevious &&
      previous &&
      ((beforePrevious.x === previous.x && previous.x === point.x) ||
        (beforePrevious.y === previous.y && previous.y === point.y))
    ) {
      compact[compact.length - 1] = point;
      return;
    }
    compact.push(point);
  });
  return compact;
}

function segmentHitsObstacle(a: RoutePoint, b: RoutePoint, obstacle: RouteObstacle) {
  const padding = 10;
  const left = obstacle.x - padding;
  const right = obstacle.x + obstacle.width + padding;
  const top = obstacle.y - padding;
  const bottom = obstacle.y + obstacle.height + padding;

  if (a.x === b.x) {
    return a.x > left && a.x < right && Math.max(a.y, b.y) > top && Math.min(a.y, b.y) < bottom;
  }
  if (a.y === b.y) {
    return a.y > top && a.y < bottom && Math.max(a.x, b.x) > left && Math.min(a.x, b.x) < right;
  }
  return false;
}

function routeHitsObstacle(points: RoutePoint[], obstacles: RouteObstacle[]) {
  return points.slice(1).some((point, index) => {
    const previous = points[index]!;
    return obstacles.some((obstacle) => segmentHitsObstacle(previous, point, obstacle));
  });
}

function routePath(source: RoutePoint, target: RoutePoint, obstacles: RouteObstacle[]) {
  const xLanes = new Set<number>([source.x, target.x]);
  const yLanes = new Set<number>([source.y, target.y]);
  obstacles.forEach((obstacle) => {
    xLanes.add(obstacle.x - 28);
    xLanes.add(obstacle.x + obstacle.width + 28);
    yLanes.add(obstacle.y - 28);
    yLanes.add(obstacle.y + obstacle.height + 28);
  });

  const candidates: RoutePoint[][] = [
    [source, { x: target.x, y: source.y }, target],
    [source, { x: source.x, y: target.y }, target],
    ...Array.from(xLanes, (x) => [source, { x, y: source.y }, { x, y: target.y }, target]),
    ...Array.from(yLanes, (y) => [source, { x: source.x, y }, { x: target.x, y }, target]),
  ];

  const valid = candidates
    .map(compactRoutePoints)
    .filter((points) => !routeHitsObstacle(points, obstacles));
  const best = valid.sort((a, b) => {
    const length = (points: RoutePoint[]) => points.slice(1).reduce(
      (total, point, index) => total + Math.abs(point.x - points[index]!.x) + Math.abs(point.y - points[index]!.y),
      0,
    );
    return length(a) - length(b) || a.length - b.length;
  })[0];

  if (best) return best;

  // A final outer lane is always outside the service cluster, so even dense
  // graphs remain connected without drawing through another service.
  const outerX = Math.max(source.x, target.x, ...obstacles.map((o) => o.x + o.width)) + 56;
  return compactRoutePoints([source, { x: outerX, y: source.y }, { x: outerX, y: target.y }, target]);
}

function routeToSvgPath(points: RoutePoint[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function routeLabelPlacement(points: RoutePoint[], label: string, labelLane = 0) {
  const MIN_LABEL_GAP = 10;
  const MIN_RUNWAY = 18;
  if (points.length < 2) {
    return { x: points[0]?.x ?? 0, y: points[0]?.y ?? 0, angle: 0, compact: true, tiny: true };
  }
  const segments = points.slice(1).map((point, index) => {
    const start = points[index]!;
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    return { start, point, length: Math.hypot(dx, dy), angle: (Math.atan2(dy, dx) * 180) / Math.PI };
  });
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  // Reserve the actual label runway before choosing its position. The old
  // midpoint-only placement could put the label directly against a node (or
  // across a corner) because the label's width was not part of the geometry.
  const normalRunway = label.length * 5.5 + 14;
  const compactRunway = label.length * 4.25 + 8;
  const compact = totalLength < Math.max(112, normalRunway + MIN_LABEL_GAP * 2 + 24);
  const tiny = totalLength < compactRunway + MIN_LABEL_GAP * 2;
  const runway = Math.max(MIN_RUNWAY, tiny ? compactRunway * 0.72 : compact ? compactRunway : normalRunway);
  let remaining = totalLength / 2;
  const midpointSegment = segments.find((candidate) => {
    if (remaining <= candidate.length) return true;
    remaining -= candidate.length;
    return false;
  }) ?? segments[segments.length - 1]!;
  // Prefer the route midpoint, but move to the longest segment if the
  // midpoint segment cannot contain a label with a gap on either side.
  const segment = midpointSegment.length >= runway + MIN_LABEL_GAP * 2
    ? midpointSegment
    : segments.reduce((longest, candidate) => candidate.length > longest.length ? candidate : longest, segments[0]!);
  const segmentStart = segment.start;
  const segmentEnd = segment.point;
  const segmentLength = segment.length;
  const halfRunway = Math.min(runway / 2, Math.max(0, (segmentLength - MIN_LABEL_GAP * 2) / 2));
  const minDistance = MIN_LABEL_GAP + halfRunway;
  const maxDistance = Math.max(minDistance, segmentLength - MIN_LABEL_GAP - halfRunway);
  const midpointDistance = midpointSegment === segment
    ? Math.max(0, Math.min(segmentLength, remaining))
    : segmentLength / 2;
  // Parallel connections share the same route midpoint. Give their labels
  // deterministic, symmetric lanes along the route so their containers do
  // not sit on top of one another while remaining attached to the path.
  const laneRank = labelLane === 0 ? 0 : labelLane % 2 === 1 ? -Math.ceil(labelLane / 2) : Math.ceil(labelLane / 2);
  const laneStep = runway + MIN_LABEL_GAP * 2;
  const distance = Math.max(minDistance, Math.min(maxDistance, midpointDistance + laneRank * laneStep));
  const ratio = segmentLength === 0 ? 0.5 : distance / segmentLength;
  let angle = segment.angle;
  const isVertical = Math.abs(segment.point.x - segment.start.x) < Math.abs(segment.point.y - segment.start.y);
  // Keep the established orientation: vertical routes keep a vertical pill,
  // including compact labels. Only normalize the direction so text is never
  // rendered upside down.
  if (angle > 90) angle -= 180;
  if (angle < -90) angle += 180;
  return {
    x: segmentStart.x + (segmentEnd.x - segmentStart.x) * ratio,
    y: segmentStart.y + (segmentEnd.y - segmentStart.y) * ratio,
    angle,
    compact,
    tiny,
    isVertical,
  };
}

function finalRouteAngle(points: RoutePoint[], target: RoutePoint) {
  for (let index = points.length - 2; index >= 0; index -= 1) {
    const previous = points[index]!;
    if (previous.x !== target.x || previous.y !== target.y) {
      return (Math.atan2(target.y - previous.y, target.x - previous.x) * 180) / Math.PI;
    }
  }
  return 0;
}

function RoutedEdge({ sourceX, sourceY, targetX, targetY, markerEnd, style, data, id, animated }: EdgeProps) {
  const edgeData = data as { obstacles?: RouteObstacle[]; connectionType?: ConnectionType; labelLane?: number } | undefined;
  const obstacles = edgeData?.obstacles ?? [];
  const connectionType = normalizeConnectionType(edgeData?.connectionType);
  const connectionLabel = connectionType === "SQL / Database Connection" ? "Database" : connectionType;
  const path = routePath({ x: sourceX, y: sourceY }, { x: targetX, y: targetY }, obstacles);
  const endpoint = { x: targetX, y: targetY };
  const arrowAngle = finalRouteAngle(path, endpoint);
  const markerId = `archguard-arrow-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const arrowColor = style?.stroke ?? "var(--primary)";
  const labelPlacement = routeLabelPlacement(path, connectionLabel, edgeData?.labelLane);
  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="6"
          markerHeight="6"
          markerUnits="userSpaceOnUse"
          viewBox="0 0 6 6"
          refX="6"
          refY="3"
          orient={arrowAngle}
        >
          <path d="M 0 0 L 6 3 L 0 6 Z" fill={arrowColor} />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={routeToSvgPath(path)}
        markerEnd={`url(#${markerId})`}
        className={animated ? "animated" : undefined}
        style={{
          ...style,
          fill: "none",
          opacity: 1,
          stroke: style?.stroke ?? "var(--primary)",
          strokeWidth: 1.6,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
        interactionWidth={22}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-none z-[5]"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelPlacement.x}px,${labelPlacement.y}px)`,
          }}
        >
          <div
            className={cn(
              "isolate whitespace-nowrap rounded border border-border bg-background text-muted-foreground shadow-sm",
              labelPlacement.tiny
                ? "px-0.5 py-0 text-[7px]"
                : labelPlacement.compact
                  ? "px-1 py-0.5 text-[8px]"
                  : "px-1.5 py-0.5 text-[9px]",
            )}
            style={{ transform: `rotate(${labelPlacement.angle}deg)` }}
          >
            {connectionLabel}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = { routed: RoutedEdge };

function buildCanvasProblems(graph: ArchGraph, analysis: AnalysisResult): Map<string, CanvasProblem[]> {
  const problems = new Map<string, CanvasProblem[]>();
  const add = (ruleResult: AnalysisResult["issues"][number], ids: string[]) => {
    if (!ids.length) return;
    const rule = ruleResult.rule;
    const why = rule.id === "sec-private-db"
      ? "Public data services increase the attack surface and can expose sensitive information."
      : rule.id === "sec-encryption" || rule.id === "comp-encryption"
        ? "Without encryption, stolen storage or intercepted data is easier to read."
        : rule.id === "avail-multi-az"
          ? "A zone outage can affect every component deployed in the same zone."
          : rule.id === "avail-db-replication" || rule.id === "spof-single-db-availability"
            ? "A single database failure can stop reads and writes for the whole application."
            : rule.id === "sec-public-exposure"
              ? "Direct client access bypasses the intended security and application layers."
              : `This issue can reduce the ${rule.category.toLowerCase()} of the architecture.`;
    const problem: CanvasProblem = {
      id: rule.id,
      title: `${rule.category} Issue`,
      severity: rule.severity,
      description: rule.issue,
      why,
      recommendation: rule.recommendation,
    };
    ids.forEach((id) => problems.set(id, [...(problems.get(id) ?? []), problem]));
  };

  analysis.issues.forEach((issue) => {
    const nodes = graph.nodes;
    const dataNodes = nodes.filter((node) => node.caps.includes("database") || node.caps.includes("storage") || node.caps.includes("object-storage"));
    const runtimeNodes = nodes.filter((node) => node.caps.includes("compute") || node.caps.includes("container") || node.caps.includes("serverless"));
    const securityNodes = nodes.filter((node) => node.caps.includes("database") || node.caps.includes("cache") || node.caps.includes("compute") || node.caps.includes("container"));
    let targets: string[];

    switch (issue.rule.id) {
      case "sec-private-db":
        targets = nodes.filter((node) => node.caps.includes("database") && node.boundary !== "private-subnet" && node.boundary !== "database-layer").map((node) => node.id);
        break;
      case "sec-encryption":
      case "comp-encryption":
        targets = dataNodes.map((node) => node.id);
        break;
      case "sec-public-exposure":
        targets = graph.edges
          .filter((edge) => nodes.some((node) => node.id === edge.source && node.caps.includes("client")) && securityNodes.some((node) => node.id === edge.target))
          .map((edge) => edge.target);
        break;
      case "avail-multi-az":
        targets = [...runtimeNodes, ...dataNodes].map((node) => node.id);
        break;
      case "avail-db-replication":
      case "spof-single-db-availability":
        targets = nodes.filter((node) => node.caps.includes("database")).map((node) => node.id);
        break;
      case "scale-lb":
      case "scale-autoscaling":
      case "scale-stateless":
      case "spof-single-backend":
      case "capacity-bottleneck":
        targets = runtimeNodes.map((node) => node.id);
        break;
      case "perf-cache":
      case "consistency-cache-required":
        targets = dataNodes.map((node) => node.id);
        break;
      case "obs-monitoring":
      case "obs-tracing":
        targets = [...runtimeNodes, ...dataNodes].map((node) => node.id);
        break;
      default:
        targets = [...runtimeNodes, ...dataNodes].map((node) => node.id);
        break;
    }
    add(issue, [...new Set(targets)]);
  });
  return problems;
}

function sameCanvasProblems(left: CanvasProblem[] | undefined, right: CanvasProblem[]) {
  const a = left ?? [];
  if (a.length !== right.length) return false;
  return a.every((problem, index) => {
    const next = right[index];
    if (!next) return false;
    return problem.id === next.id && problem.title === next.title && problem.severity === next.severity
      && problem.description === next.description && problem.why === next.why && problem.recommendation === next.recommendation;
  });
}

function semanticTypeForEdge(edge: Pick<Edge, "source" | "target" | "data">, nodes: Node[], cloud: CloudId): ConnectionType {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);
  const sourceData = source?.data as { serviceId?: string; cloud?: CloudId } | undefined;
  const targetData = target?.data as { serviceId?: string; cloud?: CloudId } | undefined;
  const sourceCaps = sourceData?.serviceId ? findService(sourceData.cloud || cloud, sourceData.serviceId)?.caps ?? [] : [];
  const targetCaps = targetData?.serviceId ? findService(targetData.cloud || cloud, targetData.serviceId)?.caps ?? [] : [];
  return normalizeConnectionType((edge.data as { connectionType?: unknown } | undefined)?.connectionType, sourceCaps, targetCaps);
}

/** Finds the first free slot on a grid so click-added nodes never overlap. */
function findFreeSlot(existing: Node[], origin: { x: number; y: number }) {
  const taken = existing.filter((n) => n.type !== "boundary").map((n) => n.position);
  const clash = (x: number, y: number) =>
    taken.some((p) => Math.abs(p.x - x) < NODE_W + GAP / 2 && Math.abs(p.y - y) < NODE_H + GAP / 2);

  const colW = NODE_W + GAP;
  const rowH = NODE_H + GAP;
  for (let ring = 0; ring < 24; ring++) {
    for (let col = 0; col <= ring; col++) {
      for (let row = 0; row <= ring; row++) {
        if (col !== ring && row !== ring) continue;
        const x = origin.x + col * colW;
        const y = origin.y + row * rowH;
        if (!clash(x, y)) return { x, y };
      }
    }
  }
  return { x: origin.x, y: origin.y + 26 * rowH };
}

interface WorkspaceProps {
  ctx: ProjectContext;
  onEditContext: () => void;
  onNewProject: () => void;
}

export function DesignerWorkspace(props: WorkspaceProps) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}

function Inner({ ctx, onEditContext, onNewProject }: WorkspaceProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [libCollapsed, setLibCollapsed] = useState(false);
  // Review is an explicit user-invoked workspace panel. New/empty canvases
  // should keep the full canvas width until the user asks for a review.
  const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(false);
  const [reviewWidth, setReviewWidth] = useState(340);
  const [tool, setTool] = useState<"select" | "pan">("select");
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(CANVAS_LOCK_STORAGE_KEY) === "true";
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [failureOpen, setFailureOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [layoutDirection, setLayoutDirection] = useState<"LR" | "TB">("LR");
  const wrapper = useRef<HTMLDivElement>(null);
  const past = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const future = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const graphRef = useRef<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const pendingDelete = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const saveTimer = useRef<number | null>(null);
  const { screenToFlowPosition, fitView, zoomIn, zoomOut, deleteElements, getViewport } =
    useReactFlow();

  const [zoomPct, setZoomPct] = useState(100);
  const [canvasTheme, setCanvasTheme] = useState<CanvasTheme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(CANVAS_THEME_STORAGE_KEY);
    return stored === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(CANVAS_THEME_STORAGE_KEY, canvasTheme);
    } catch {
      // ignore storage failures
    }
  }, [canvasTheme]);

  useEffect(() => {
    const handleAppThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<CanvasTheme>).detail;
      if (nextTheme === "light" || nextTheme === "dark") setCanvasTheme(nextTheme);
    };
    window.addEventListener(CANVAS_THEME_EVENT, handleAppThemeChange);
    return () => window.removeEventListener(CANVAS_THEME_EVENT, handleAppThemeChange);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CANVAS_LOCK_STORAGE_KEY, String(isLocked));
    } catch {
      // ignore storage failures
    }
  }, [isLocked]);

  const canvasPalette = CANVAS_THEMES[canvasTheme];
  const renderedNodes = useMemo(
    () =>
      nodes.map((node) => {
        const hasProblems = node.type === "service"
          && Array.isArray((node.data as { problems?: unknown[] }).problems)
          && (node.data as { problems: unknown[] }).problems.length > 0;

        return {
          ...node,
          ...(node.type === "service"
            ? { zIndex: hasProblems ? PROBLEM_NODE_Z_INDEX : CANVAS_NODE_Z_INDEX }
            : {}),
          data: isLocked ? { ...node.data, locked: true } : node.data,
        };
      }),
    [isLocked, nodes],
  );

  const normalizeNodes = useCallback(
    (list: Node[]) =>
      normalizeBoundaryLayout(list as DiagramNodeLike[], {
        cloud: ctx.cloud,
        resolveService: (node) => {
          if (node.type !== "service") return undefined;
          const data = node.data as { serviceId?: string; cloud?: CloudId };
          if (!data.serviceId) return undefined;
          const svc = findService(data.cloud || ctx.cloud, data.serviceId);
          return svc ? { id: svc.id, category: svc.category, caps: svc.caps } : undefined;
        },
      }) as Node[],
    [ctx.cloud],
  );

  const commitNodes = useCallback(
    (updater: Node[] | ((curr: Node[]) => Node[])) => {
      setNodes((current) => {
        const next = typeof updater === "function" ? updater(current) : updater;
        return normalizeNodes(next);
      });
    },
    [normalizeNodes, setNodes],
  );

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof applyNodeChanges>[0]) => {
      if (isLocked) return;
      setNodes((current) => normalizeNodes(applyNodeChanges(changes, current)));
    },
    [isLocked, normalizeNodes, setNodes],
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      if (isLocked) return;
      onEdgesChange(changes);
    },
    [isLocked, onEdgesChange],
  );

  // Keep the visible zoom percentage in sync with the viewport. Polling is
  // used because React Flow does not expose a lightweight viewport-change
  // event here; this keeps the UI responsive when the user zooms with
  // mouse/touchpad or the built-in controls.
  useEffect(() => {
    let mounted = true;
    const tick = () => {
      try {
        const vp = getViewport();
        if (!mounted) return;
        setZoomPct(Math.round((vp.zoom ?? 1) * 100));
      } catch {
        // ignore while provider not ready
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [getViewport]);

  // Restore the in-progress diagram when the user returns to the designer.
  useEffect(() => {
    const stored = loadGraph();
    if (stored?.nodes?.length || stored?.edges?.length) {
      const restoredNodes = stored.nodes as Node[];
      commitNodes(restoredNodes);
      setEdges((stored.edges as Edge[]).map((edge) => ({
        ...edge,
        data: {
          ...(edge.data ?? {}),
          connectionType: semanticTypeForEdge(edge, restoredNodes, ctx.cloud),
          labelLane: (stored.edges as Edge[]).filter((candidate) => candidate.source === edge.source && candidate.target === edge.target && candidate.id < edge.id).length,
        },
      })));
      setTimeout(() => fitView({ padding: 0.2 }), 80);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitNodes, ctx.cloud]);

  useEffect(() => {
    commitNodes((nds) => {
      let changed = false;
      const next = nds.map((n) => {
        if (n.type !== "boundary") return n;
        const d = n.data as { kind?: string; label?: string; cloud?: CloudId };
        if (!d.kind) return n;
        const label = getBoundaryLabel(d.kind as any, ctx.cloud);
        if (d.cloud === ctx.cloud && d.label === label) return n;
        changed = true;
        return {
          ...n,
          data: { ...d, cloud: ctx.cloud, label },
        };
      });
      return changed ? next : nds;
    });
  }, [commitNodes, ctx.cloud]);

  useEffect(() => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveGraph({ nodes, edges });
      saveTimer.current = null;
    }, 250);
    return () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    };
  }, [nodes, edges]);

  // Keep delete handling based on the latest committed graph. This ref avoids
  // putting graph snapshots into React state and therefore cannot disturb the
  // canvas viewport, selection, or open panels.
  useEffect(() => {
    graphRef.current = { nodes, edges };
  }, [nodes, edges]);

  useEffect(() => () => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    if (shouldSaveGraphOnUnmount()) saveGraph(graphRef.current);
  }, []);

  // Automatically adjust canvas when side panels are collapsed or expanded
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nodes.length > 0) {
        fitView({ padding: 0.2, duration: 400 });
      }
    }, 320); // wait slightly longer than CSS transition (300ms)
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReviewPanelOpen, libCollapsed, fitView]);

  const cost = useMemo(
    () =>
      estimateCost(
        nodes
          .filter((n) => n.type === "service")
          .map((n) => {
            const d = n.data as { serviceId: string; label: string; cloud?: CloudId };
            const svc = findService(d.cloud || ctx.cloud, d.serviceId);
            return { id: n.id, serviceId: d.serviceId, label: d.label, caps: svc?.caps ?? [] };
          }),
        ctx,
      ),
    [nodes, ctx],
  );

  const snapshot = useCallback(() => {
    past.current = [...past.current.slice(-40), { nodes, edges }];
    future.current = [];
  }, [nodes, edges]);

  const undo = () => {
    if (isLocked) return;
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push({ nodes, edges });
    commitNodes(prev.nodes);
    setEdges(prev.edges);
  };

  const redo = () => {
    if (isLocked) return;
    const next = future.current.pop();
    if (!next) return;
    past.current.push({ nodes, edges });
    commitNodes(next.nodes);
    setEdges(next.edges);
  };

  // React Flow already strips edges attached to a removed node; we only add the
  // snapshot + undo affordance around it so deletion is safe.
  const onBeforeDelete = useCallback(async () => {
    if (isLocked) return false;
    pendingDelete.current = {
      nodes: [...graphRef.current.nodes],
      edges: [...graphRef.current.edges],
    };
    return true;
  }, [isLocked]);

  const onDelete = useCallback(
    ({ nodes: removed }: { nodes: Node[]; edges: Edge[] }) => {
      if (isLocked) return;
      const before = pendingDelete.current;
      pendingDelete.current = null;
      if (!before || removed.length === 0) return;
      past.current = [...past.current.slice(-40), before];
      future.current = [];
    },
    [isLocked],
  );

  // Delete affordance rendered on each node dispatches through React Flow so
  // edges, selection and history all stay consistent.
  useEffect(() => {
    const handler = (event: Event) => {
      if (isLocked) return;
      const id = (event as CustomEvent<{ id: string }>).detail?.id;
      if (!id) return;
      void deleteElements({ nodes: [{ id }] });
    };
    window.addEventListener(DELETE_NODE_EVENT, handler);
    return () => window.removeEventListener(DELETE_NODE_EVENT, handler);
  }, [deleteElements, isLocked]);

  const addFromLibrary = useCallback(
    (payload: LibraryPayload) => {
      if (isLocked) return;
      snapshot();
      const vp = getViewport();
      const box = wrapper.current?.getBoundingClientRect();
      const originX = (-vp.x + (box ? box.width * 0.2 : 160)) / vp.zoom;
      const originY = (-vp.y + (box ? box.height * 0.18 : 120)) / vp.zoom;

      if (payload.kind === "boundary") {
        commitNodes((nds) =>
          adjustBoundaryZIndices([
            {
              id: nextId(),
              type: "boundary",
              position: { x: Math.round(originX), y: Math.round(originY) },
              data: { kind: payload.id, label: getBoundaryLabel(payload.id as any, ctx.cloud), cloud: ctx.cloud },
              style: { width: 380, height: 240 },
              selectable: true,
            } as Node,
            ...nds,
          ]),
        );
        // if user is zoomed in very far, gently nudge viewport back so the
        // newly-created boundary isn't enormous on-screen.
        const vp = getViewport();
        if ((vp.zoom ?? 1) > 1.25) {
          void zoomOut();
        }
        return;
      }

      commitNodes((nds) => {
        const position = findFreeSlot(nds, {
          x: Math.round(originX),
          y: Math.round(originY),
        });
        return [
          ...nds,
          {
            id: nextId(),
            type: "service",
            position,
            data: { serviceId: payload.id, cloud: ctx.cloud as CloudId, label: payload.label },
          } as Node,
        ];
      });
      const vp2 = getViewport();
      if ((vp2.zoom ?? 1) > 1.25) void zoomOut();
    },
    [commitNodes, ctx.cloud, getViewport, isLocked, snapshot, zoomOut],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (isLocked) return;
      snapshot();
      // pick best handles based on current node positions
      const pickHandles = (srcId?: string, tgtId?: string) => {
        if (!srcId || !tgtId) return {} as { sourceHandle?: string; targetHandle?: string };
        const src = nodes.find((n) => n.id === srcId);
        const tgt = nodes.find((n) => n.id === tgtId);
        if (!src || !tgt) return {} as { sourceHandle?: string; targetHandle?: string };
        const sW = Number(src.style?.width ?? NODE_W);
        const sH = Number(src.style?.height ?? NODE_H);
        const tW = Number(tgt.style?.width ?? NODE_W);
        const tH = Number(tgt.style?.height ?? NODE_H);
        const sCx = src.position.x + sW / 2;
        const sCy = src.position.y + sH / 2;
        const tCx = tgt.position.x + tW / 2;
        const tCy = tgt.position.y + tH / 2;
        const dx = tCx - sCx;
        const dy = tCy - sCy;
        const sourceCandidates = ["right", "bottom", "bottom-right", "bottom-left", "bottom-quarter-left", "bottom-quarter-right", "bottom-eighth-left", "bottom-eighth-right", "bottom-three-eighths-left", "bottom-three-eighths-right", "right-quarter-top", "right-quarter-bottom", "right-eighth-top"];
        const targetCandidates = ["left", "top", "top-left", "top-right", "top-quarter-left", "top-quarter-right", "top-eighth-left", "top-eighth-right", "top-three-eighths-left", "top-three-eighths-right", "left-quarter-top", "left-quarter-bottom", "left-eighth-top"];
        const handlePoint = (n: Node, h: string) => {
          const w = Number(n.style?.width ?? NODE_W);
          const hgt = Number(n.style?.height ?? NODE_H);
          const cx = n.position.x + w / 2;
          const cy = n.position.y + hgt / 2;
          switch (h) {
            case "top":
              return { x: cx, y: n.position.y };
            case "top-left":
              return { x: n.position.x + 8, y: n.position.y };
            case "top-right":
              return { x: n.position.x + w - 8, y: n.position.y };
            case "top-quarter-left":
              return { x: n.position.x + w / 4, y: n.position.y };
            case "top-quarter-right":
              return { x: n.position.x + (w * 3) / 4, y: n.position.y };
            case "top-eighth-left":
              return { x: n.position.x + w / 8, y: n.position.y };
            case "top-eighth-right":
              return { x: n.position.x + (w * 7) / 8, y: n.position.y };
            case "top-three-eighths-left":
              return { x: n.position.x + (w * 3) / 8, y: n.position.y };
            case "top-three-eighths-right":
              return { x: n.position.x + (w * 5) / 8, y: n.position.y };
            case "left-quarter-top":
              return { x: n.position.x, y: n.position.y + (hgt * 3) / 8 };
            case "left-quarter-bottom":
              return { x: n.position.x, y: n.position.y + (hgt * 5) / 8 };
            case "left-eighth-top":
              return { x: n.position.x, y: n.position.y + hgt / 8 };
            case "bottom":
              return { x: cx, y: n.position.y + hgt };
            case "bottom-left":
              return { x: n.position.x + 8, y: n.position.y + hgt };
            case "bottom-right":
              return { x: n.position.x + w - 8, y: n.position.y + hgt };
            case "bottom-quarter-left":
              return { x: n.position.x + w / 4, y: n.position.y + hgt };
            case "bottom-quarter-right":
              return { x: n.position.x + (w * 3) / 4, y: n.position.y + hgt };
            case "bottom-eighth-left":
              return { x: n.position.x + w / 8, y: n.position.y + hgt };
            case "bottom-eighth-right":
              return { x: n.position.x + (w * 7) / 8, y: n.position.y + hgt };
            case "bottom-three-eighths-left":
              return { x: n.position.x + (w * 3) / 8, y: n.position.y + hgt };
            case "bottom-three-eighths-right":
              return { x: n.position.x + (w * 5) / 8, y: n.position.y + hgt };
            case "right-quarter-top":
              return { x: n.position.x + w, y: n.position.y + (hgt * 3) / 8 };
            case "right-quarter-bottom":
              return { x: n.position.x + w, y: n.position.y + (hgt * 5) / 8 };
            case "right-eighth-top":
              return { x: n.position.x + w, y: n.position.y + hgt / 8 };
            case "left":
              return { x: n.position.x, y: n.position.y + hgt / 2 };
            default:
              return { x: n.position.x + w, y: n.position.y + hgt / 2 };
          }
        };

        const obstacles = nodes
          .filter((node) => node.type === "service" && node.id !== srcId && node.id !== tgtId)
          .map((node) => ({
            x: node.position.x,
            y: node.position.y,
            width: Number(node.style?.width ?? NODE_W),
            height: Number(node.style?.height ?? NODE_H),
          }));

        let best: { s?: string; t?: string; d?: number } = { d: Infinity };
        for (const sHc of sourceCandidates) {
          for (const tHc of targetCandidates) {
            const p1 = handlePoint(src, sHc);
            const p2 = handlePoint(tgt, tHc);
            const route = routePath(p1, p2, obstacles);
            const routeLength = route.slice(1).reduce(
              (total, point, index) => total + Math.abs(point.x - route[index]!.x) + Math.abs(point.y - route[index]!.y),
              0,
            );
            const turns = Math.max(0, route.length - 2);
            const directionBias = Math.abs(dx) > Math.abs(dy) * 1.2
              ? (sHc === "right" && tHc === "left" ? -12 : 0)
              : Math.abs(dy) > Math.abs(dx) * 1.2 && sHc === "bottom" && tHc === "top" ? -12 : 0;
            const score = routeLength + turns * 18 + directionBias;
            if (score < (best.d ?? Infinity)) best = { s: sHc, t: tHc, d: score };
          }
        }
        return { sourceHandle: best.s, targetHandle: best.t } as {
          sourceHandle?: string;
          targetHandle?: string;
        };
      };

      const handles = pickHandles(params.source, params.target);
      const sourceNode = nodes.find((node) => node.id === params.source);
      const targetNode = nodes.find((node) => node.id === params.target);
      const sourceData = sourceNode?.data as { serviceId?: string; cloud?: CloudId } | undefined;
      const targetData = targetNode?.data as { serviceId?: string; cloud?: CloudId } | undefined;
      const defaultConnectionType = inferConnectionType(
        sourceData?.serviceId ? findService(sourceData.cloud || ctx.cloud, sourceData.serviceId)?.caps ?? [] : [],
        targetData?.serviceId ? findService(targetData.cloud || ctx.cloud, targetData.serviceId)?.caps ?? [] : [],
      );
      const sourceCaps = sourceData?.serviceId ? findService(sourceData.cloud || ctx.cloud, sourceData.serviceId)?.caps ?? [] : [];
      const targetCaps = targetData?.serviceId ? findService(targetData.cloud || ctx.cloud, targetData.serviceId)?.caps ?? [] : [];
      const validationError = connectionValidationError(sourceCaps, targetCaps);
      if (validationError) {
        toast.error("Connection not recommended", { description: validationError });
        return;
      }
      const newEdgeId = params.id ?? nextId();
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: newEdgeId,
            ...handles,
            type: "routed",
            data: {
              connectionType: defaultConnectionType,
              labelLane: eds.filter((edge) => edge.source === params.source && edge.target === params.target).length,
              obstacles: nodes
                .filter((node) => node.type === "service" && node.id !== params.source && node.id !== params.target)
                .map((node) => ({
                  x: node.position.x,
                  y: node.position.y,
                  width: Number(node.style?.width ?? NODE_W),
                  height: Number(node.style?.height ?? NODE_H),
                })),
            },
            animated: true,
            zIndex: 1,
            style: { stroke: connectionColor(eds.length) },
            markerEnd: { type: MarkerType.ArrowClosed, color: connectionColor(eds.length), width: 12, height: 12 },
          },
          eds,
        ),
      );
      setSelectedEdgeId(newEdgeId);
    },
    [ctx.cloud, isLocked, setEdges, snapshot, nodes],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (isLocked || tool === "pan") return;

      const raw = event.dataTransfer.getData("application/archguard");
      if (!raw) return;
      const payload = JSON.parse(raw) as { kind: string; id: string; label: string };
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      snapshot();

      if (payload.kind === "boundary") {
        commitNodes((nds) =>
          adjustBoundaryZIndices([
            {
              id: nextId(),
              type: "boundary",
              position,
              data: { kind: payload.id, label: getBoundaryLabel(payload.id as any, ctx.cloud), cloud: ctx.cloud },
              style: { width: 380, height: 240 },
              selectable: true,
            } as Node,
            ...nds,
          ]),
        );
        const vp = getViewport();
        if ((vp.zoom ?? 1) > 1.25) void zoomOut();
        return;
      }

      commitNodes((nds) => [
        ...nds,
        {
          id: nextId(),
          type: "service",
          position,
          data: { serviceId: payload.id, cloud: ctx.cloud as CloudId, label: payload.label },
        } as Node,
      ]);
      const vp2 = getViewport();
      if ((vp2.zoom ?? 1) > 1.25) void zoomOut();
    },
    [commitNodes, ctx.cloud, isLocked, screenToFlowPosition, snapshot, tool],
  );

  const boundaryOf = useCallback(
    (node: Node) => {
      const boundaries = nodes.filter((n) => n.type === "boundary");
      const nodeRect = rectForNode(node as DiagramNodeLike);
      const inside = boundaries.filter((b) => {
        const bRect = rectForNode(b as DiagramNodeLike);
        const inner = {
          x: bRect.x + 18,
          y: bRect.y + 18,
          width: Math.max(0, bRect.width - 36),
          height: Math.max(0, bRect.height - 36),
        };
        return rectContainsRect(inner, nodeRect);
      });
      const priority = [
        "database-layer",
        "service-boundary",
        "security-zone",
        "private-subnet",
        "public-subnet",
        "k8s",
        "az",
        "vpc",
        "region",
      ];
      for (const kind of priority) {
        if (inside.some((b) => (b.data as { kind: string }).kind === kind)) return kind;
      }
      return inside[0] ? ((inside[0].data as { kind: string }).kind ?? undefined) : undefined;
    },
    [nodes],
  );

  // Recompute zIndex for boundary nodes so inner boundaries appear above
  // outer ones (higher zIndex) and clicks target the nearest/topmost element.
  const adjustBoundaryZIndices = useCallback((nds: Node[]) => {
    const bounds = nds
      .filter((n) => n.type === "boundary" && n.position && n.style)
      .map((b) => ({
        id: b.id,
        x: b.position.x,
        y: b.position.y,
        width: Number(b.style?.width ?? 380),
        height: Number(b.style?.height ?? 240),
      }));

    function contains(a: any, b: any) {
      return (
        a.x <= b.x &&
        a.y <= b.y &&
        a.x + a.width >= b.x + b.width &&
        a.y + a.height >= b.y + b.height
      );
    }

    const zForId: Record<string, number> = {};
    for (const b of bounds) {
      let count = 0;
      for (const o of bounds) {
        if (o.id === b.id) continue;
        if (contains(o, b)) count++;
      }
      zForId[b.id] = 100 + count * 10;
    }

    return nds.map((n) => {
      if (n.type === "boundary" && zForId[n.id] != null) return { ...n, zIndex: zForId[n.id] } as Node;
      return n;
    });
  }, []);

  // Build the ArchGraph used by both the deterministic review and the
  // failure simulator so both paths always evaluate the same graph.
  const buildGraph = useCallback<() => ArchGraph>(() => ({
    nodes: nodes
      .filter((n) => n.type === "service")
      .map((n) => {
        const d = n.data as { serviceId: string; label: string; cloud?: CloudId };
        const svc = findService(d.cloud || ctx.cloud, d.serviceId);
        return { id: n.id, serviceId: d.serviceId, label: d.label, caps: svc?.caps ?? [], cloud: d.cloud || ctx.cloud, boundary: boundaryOf(n) };
      }),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: semanticTypeForEdge(e, nodes, ctx.cloud) })),
  }), [boundaryOf, ctx, edges, nodes]);

  // Ignore transient UI fields written after analysis. Geometry and semantic
  // data remain included because boundaries and connection types affect rules.
  const architectureSignature = useMemo(
    () => JSON.stringify({
      context: ctx,
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        style: node.style,
        data: node.data && Object.fromEntries(
          Object.entries(node.data).filter(([key]) => key !== "problems" && key !== "locked"),
        ),
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        connectionType: (edge.data as { connectionType?: unknown } | undefined)?.connectionType,
      })),
    }),
    [ctx, edges, nodes],
  );

  const applyAnalysis = useCallback((graph: ArchGraph) => {
    const analysis = analyzeArchitecture(graph, ctx);
    setResult(analysis);
    const canvasProblems = buildCanvasProblems(graph, analysis);
    setNodes((current) => {
      let changed = false;
      const next = current.map((node) => {
        if (node.type !== "service") return node;
        const problems = canvasProblems.get(node.id) ?? [];
        const existing = (node.data as { problems?: CanvasProblem[] }).problems;
        if (sameCanvasProblems(existing, problems)) return node;
        changed = true;
        return { ...node, data: { ...node.data, problems } };
      });
      return changed ? next : current;
    });
    return analysis;
  }, [ctx, setNodes]);

  // Recalculate locally as soon as the committed graph changes. Only
  // persistence is deferred; visual canvas interactions are never debounced.
  useEffect(() => {
    applyAnalysis(buildGraph());
    // architectureSignature excludes the result decorations written above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [architectureSignature]);

  const runReview = () => {
    if (nodes.filter((n) => n.type === "service").length === 0) {
      toast.error("Architecture is empty", {
        description: "Add at least one component to the canvas before reviewing your architecture.",
        action: { label: "Add Components", onClick: () => setLibCollapsed(false) },
      });
      return;
    }
    const analysis = applyAnalysis(buildGraph());
    setIsReviewPanelOpen(true);
    toast.success(`Review complete — ${analysis.overall}/100 · ${analysis.maturity}`);
  };

  const selectedEdge = selectedEdgeId ? edges.find((edge) => edge.id === selectedEdgeId) : undefined;
  const selectedEdgeType = selectedEdge ? semanticTypeForEdge(selectedEdge, nodes, ctx.cloud) : undefined;
  const updateSelectedEdgeType = (connectionType: ConnectionType) => {
    if (!selectedEdgeId || isLocked) return;
    snapshot();
    setEdges((current) => current.map((edge) =>
      edge.id === selectedEdgeId
        ? { ...edge, data: { ...(edge.data ?? {}), connectionType } }
        : edge,
    ));
  };

  const autoLayout = (dirOverride?: "LR" | "TB") => {
    if (isLocked) return;
    const activeDirection = dirOverride || layoutDirection;
    if (dirOverride) setLayoutDirection(dirOverride);

    const services = nodes.filter((n) => n.type === "service");
    if (services.length < 2) {
      toast.error("Add at least two components before running Auto Layout.");
      return;
    }
    snapshot();

    const layoutNodes = services.map((n) => {
      const d = n.data as { serviceId: string; label: string; cloud?: CloudId };
      const svc = findService(d.cloud || ctx.cloud, d.serviceId);
      return {
        id: n.id,
        serviceId: d.serviceId,
        label: d.label,
        category: svc?.category ?? "",
        cloud: d.cloud || ctx.cloud,
        caps: svc?.caps ?? [],
      };
    });

    // If the user has explicitly selected boundaries, only consider those.
    // Otherwise fall back to all boundaries present on the canvas. Also
    // exclude any boundaries that do not spatially contain any of the
    // services being laid out — this prevents including irrelevant
    // nesting containers.
    const selectedBoundaries = nodes.filter((n) => n.type === "boundary" && (n as any).selected);
    let boundaryCandidates = selectedBoundaries.length
      ? selectedBoundaries
      : nodes.filter((n) => n.type === "boundary");

    const boundaryNodes = boundaryCandidates.map((n) => ({
      id: n.id,
      kind: (n.data as { kind: string }).kind as (typeof BOUNDARY_KINDS)[number]["id"],
    }));

    const {
      positions,
      edges: flowEdges,
      boundaries,
      warnings,
      summary,
    } = computeAutoLayout(
      layoutNodes,
      ctx,
      boundaryNodes,
      edges.map(e => ({ source: e.source, target: e.target })),
      activeDirection
    );

    // Build new nodes array with auto-layout positions and sizes applied.
    const newNodes = nodes.map((n) => {
      if (positions[n.id]) return { ...n, position: positions[n.id]! };
      const rect = boundaries[n.id];
      if (rect) {
        return {
          ...n,
          position: { x: rect.x, y: rect.y },
          style: { ...n.style, width: rect.width, height: rect.height },
        };
      }
      return n;
    });

    // Adjust z-indexes for nested boundaries so interaction targets the
    // innermost/topmost boundary first.
    commitNodes(() => adjustBoundaryZIndices(normalizeNodes(newNodes)));

    const handleUsage = new Map<string, number>();

    // When creating edges via auto-layout, pick handles for clean routing.
    const pickHandlesForIds = (srcId: string, tgtId: string) => {
      const src = newNodes.find((n) => n.id === srcId);
      const tgt = newNodes.find((n) => n.id === tgtId);
      if (!src || !tgt) return {} as { sourceHandle?: string; targetHandle?: string };

      // Use updated positions from newNodes (post-layout)
      const sW = NODE_W;
      const sH = NODE_H;
      const tW = NODE_W;

      const handlePoint = (pos: { x: number; y: number }, h: string) => {
        const cx = pos.x + sW / 2;
        const cy = pos.y + sH / 2;
        switch (h) {
          case "top":          return { x: cx, y: pos.y };
          case "top-left":     return { x: pos.x + 8, y: pos.y };
          case "top-right":    return { x: pos.x + tW - 8, y: pos.y };
          case "top-quarter-left":  return { x: pos.x + tW / 4, y: pos.y };
          case "top-quarter-right": return { x: pos.x + (tW * 3) / 4, y: pos.y };
          case "top-eighth-left":  return { x: pos.x + tW / 8, y: pos.y };
          case "top-eighth-right": return { x: pos.x + (tW * 7) / 8, y: pos.y };
          case "top-three-eighths-left":  return { x: pos.x + (tW * 3) / 8, y: pos.y };
          case "top-three-eighths-right": return { x: pos.x + (tW * 5) / 8, y: pos.y };
          case "left-quarter-top":     return { x: pos.x, y: pos.y + (sH * 3) / 8 };
          case "left-quarter-bottom":  return { x: pos.x, y: pos.y + (sH * 5) / 8 };
          case "left-eighth-top":       return { x: pos.x, y: pos.y + sH / 8 };
          case "bottom":       return { x: cx, y: pos.y + sH };
          case "bottom-left":  return { x: pos.x + 8, y: pos.y + sH };
          case "bottom-right": return { x: pos.x + tW - 8, y: pos.y + sH };
          case "bottom-quarter-left":  return { x: pos.x + tW / 4, y: pos.y + sH };
          case "bottom-quarter-right": return { x: pos.x + (tW * 3) / 4, y: pos.y + sH };
          case "bottom-eighth-left":  return { x: pos.x + tW / 8, y: pos.y + sH };
          case "bottom-eighth-right": return { x: pos.x + (tW * 7) / 8, y: pos.y + sH };
          case "bottom-three-eighths-left":  return { x: pos.x + (tW * 3) / 8, y: pos.y + sH };
          case "bottom-three-eighths-right": return { x: pos.x + (tW * 5) / 8, y: pos.y + sH };
          case "right-quarter-top":    return { x: pos.x + tW, y: pos.y + (sH * 3) / 8 };
          case "right-quarter-bottom": return { x: pos.x + tW, y: pos.y + (sH * 5) / 8 };
          case "right-eighth-top":      return { x: pos.x + tW, y: pos.y + sH / 8 };
          case "left":         return { x: pos.x, y: pos.y + sH / 2 };
          default:              return { x: pos.x + tW, y: pos.y + sH / 2 };
        }
      };

      const srcPos = src.position;
      const tgtPos = tgt.position;

      const sourceHandles = activeDirection === "LR"
        ? ["right", "bottom-right", "bottom-left", "bottom-quarter-left", "bottom-quarter-right", "bottom-eighth-left", "bottom-eighth-right", "bottom-three-eighths-left", "bottom-three-eighths-right", "right-quarter-top", "right-quarter-bottom", "right-eighth-top"]
        : ["bottom", "bottom-right", "bottom-left", "bottom-quarter-left", "bottom-quarter-right", "bottom-eighth-left", "bottom-eighth-right", "bottom-three-eighths-left", "bottom-three-eighths-right", "right-quarter-top", "right-quarter-bottom", "right-eighth-top"];
      const targetHandles = activeDirection === "LR"
        ? ["left", "top-left", "top-right", "top-quarter-left", "top-quarter-right", "top-eighth-left", "top-eighth-right", "top-three-eighths-left", "top-three-eighths-right", "left-quarter-top", "left-quarter-bottom", "left-eighth-top"]
        : ["top", "top-left", "top-right", "top-quarter-left", "top-quarter-right", "top-eighth-left", "top-eighth-right", "top-three-eighths-left", "top-three-eighths-right", "left-quarter-top", "left-quarter-bottom", "left-eighth-top"];
      const obstacles = newNodes
        .filter((node) => node.type === "service" && node.id !== srcId && node.id !== tgtId)
        .map((node) => ({ x: node.position.x, y: node.position.y, width: NODE_W, height: NODE_H }));

      // Choose the shortest collision-free route, with a small penalty for
      // extra turns and already-busy handles. The router and the handle
      // selector therefore optimize the same geometry.
      let bestScore = Infinity;
      let finalSrc = sourceHandles[0]!;
      let finalTgt = targetHandles[0]!;
      for (const sourceHandle of sourceHandles) {
        for (const targetHandle of targetHandles) {
          const sourcePoint = handlePoint(srcPos, sourceHandle);
          const targetPoint = handlePoint(tgtPos, targetHandle);
          const route = routePath(sourcePoint, targetPoint, obstacles);
          const routeLength = route.slice(1).reduce(
            (total, point, index) => total + Math.abs(point.x - route[index]!.x) + Math.abs(point.y - route[index]!.y),
            0,
          );
          const turns = Math.max(0, route.length - 2);
          const sourceUsage = handleUsage.get(`${srcId}-${sourceHandle}`) ?? 0;
          const targetUsage = handleUsage.get(`${tgtId}-${targetHandle}`) ?? 0;
          const score = routeLength + turns * 18 + sourceUsage * 42 + targetUsage * 42;
          if (score < bestScore) {
            bestScore = score;
            finalSrc = sourceHandle;
            finalTgt = targetHandle;
          }
        }
      }

      // Record the winning handles so future edges fan out.
      handleUsage.set(`${srcId}-${finalSrc}`, (handleUsage.get(`${srcId}-${finalSrc}`) ?? 0) + 1);
      handleUsage.set(`${tgtId}-${finalTgt}`, (handleUsage.get(`${tgtId}-${finalTgt}`) ?? 0) + 1);

      return { sourceHandle: finalSrc, targetHandle: finalTgt } as {
        sourceHandle?: string;
        targetHandle?: string;
      };
    };

    setEdges(
      flowEdges.map((e, i) => ({
        id: `auto-${i}-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        ...pickHandlesForIds(e.source, e.target),
        type: "routed",
        data: {
          connectionType: semanticTypeForEdge(e, newNodes, ctx.cloud),
          labelLane: flowEdges.slice(0, i).filter((candidate) => candidate.source === e.source && candidate.target === e.target).length,
          obstacles: newNodes
            .filter((node) => node.type === "service" && node.id !== e.source && node.id !== e.target)
            .map((node) => ({ x: node.position.x, y: node.position.y, width: NODE_W, height: NODE_H })),
        },
        animated: true,
        zIndex: 1,
        style: { stroke: connectionColor(i) },
        markerEnd: { type: MarkerType.ArrowClosed, color: connectionColor(i), width: 12, height: 12 },
      })),
    );

    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 80);

    if (warnings.length) {
      warnings.forEach((w) => toast.warning(w, { duration: 8000 }));
    }
    toast.success(
      "Architecture flow generated successfully based on your selected components and project requirements.",
      {
        description: summary || undefined,
        action: { label: "Undo Auto Layout", onClick: () => undo() },
        duration: 10000,
      },
    );
  };

  const applyLayoutDirection = (direction: "LR" | "TB") => {
    if (isLocked) return;
    setLayoutDirection(direction);
    if (nodes.filter((n) => n.type === "service").length >= 2) {
      autoLayout(direction);
    }
  };

  const layoutDirectionLabel = layoutDirection === "TB" ? "Top -> Down" : "Left -> Right";

  const addText = () => {
    if (isLocked) return;
    snapshot();
    commitNodes((nds) => [
      ...nds,
      { id: nextId(), type: "text", position: { x: 60, y: 40 }, data: { label: "Label" } } as Node,
    ]);
  };

  const addGroup = () => {
    if (isLocked) return;
    snapshot();
    commitNodes((nds) =>
      adjustBoundaryZIndices([
        {
          id: nextId(),
          type: "boundary",
          position: { x: 40, y: 40 },
          data: { kind: "service-boundary", label: getBoundaryLabel("service-boundary", ctx.cloud), cloud: ctx.cloud },
          style: { width: 400, height: 260 },
        } as Node,
        ...nds,
      ]),
    );
  };

  const fullscreen = () => {
    const el = wrapper.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  };

  async function captureFlowAsDataUrl(
    node: HTMLElement,
    options?: { scale?: number; type?: "png" | "jpeg"; quality?: number },
  ) {
    const scale = options?.scale ?? 3;
    const type = options?.type === "jpeg" ? "image/jpeg" : "image/png";
    const quality = options?.quality ?? 1;

    try {
      const mod = await import("html-to-image");

      const pad = 32;
      let logicalWidth = 800;
      let logicalHeight = 600;
      let xOffset = 0;
      let yOffset = 0;

      if (nodes.length > 0) {
        const bounds = getNodesBounds(nodes);
        logicalWidth = Math.ceil(bounds.width) + pad * 2;
        logicalHeight = Math.ceil(bounds.height) + pad * 2;
        xOffset = -bounds.x + pad;
        yOffset = -bounds.y + pad;
      } else {
        const rRect = wrapper.current?.getBoundingClientRect();
        if (rRect) {
          logicalWidth = rRect.width;
          logicalHeight = rRect.height;
        }
      }

      const viewportEl = node.querySelector(".react-flow__viewport") as HTMLElement;
      if (!viewportEl) throw new Error("Viewport not found");

      const captureOptions = {
        backgroundColor: "#ffffff",
        width: logicalWidth,
        height: logicalHeight,
        style: {
          width: `${logicalWidth}px`,
          height: `${logicalHeight}px`,
          transform: `translate(${xOffset}px, ${yOffset}px) scale(1)`,
          transformOrigin: "0 0",
        },
        pixelRatio: scale,
        quality: type === "image/jpeg" ? quality : undefined,
        // Optional: filter out unwanted UI controls if they happen to sneak in
        filter: (el: HTMLElement) => {
          if (el?.classList?.contains("react-flow__controls")) return false;
          if (el?.classList?.contains("react-flow__minimap")) return false;
          if (el?.classList?.contains("react-flow__panel")) return false;
          return true;
        },
      };

      if (type === "image/png") {
        return await (mod as any).toPng(viewportEl, captureOptions);
      } else {
        return await (mod as any).toJpeg(viewportEl, captureOptions);
      }
    } catch (err) {
      throw err;
    }
  }

  async function downloadDataUrl(dataUrl: string, filename: string) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handleSave(): Promise<void> {
    if (!wrapper.current) {
      toast.error("Canvas not ready");
      return;
    }
    try {
      const dataUrl = await captureFlowAsDataUrl(wrapper.current, { scale: 3, type: "png" });
      await downloadDataUrl(dataUrl, `architecture-${Date.now()}.png`);
      toast.success("Image saved to your device");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save image: " + String(err));
    }
  }

  async function handleExport(): Promise<void> {
    if (!wrapper.current) {
      toast.error("Canvas not ready");
      return;
    }
    try {
      const fmt = window.prompt("Export format: png or jpg", "png")?.toLowerCase();
      const type = fmt === "jpg" || fmt === "jpeg" ? "jpeg" : "png";
      const dataUrl = await captureFlowAsDataUrl(wrapper.current, {
        scale: 3,
        type: type as any,
        quality: 1,
      });
      await downloadDataUrl(
        dataUrl,
        `architecture-${Date.now()}.${type === "jpeg" ? "jpg" : "png"}`,
      );
      toast.success("Export complete");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export image: " + String(err));
    }
  }

  async function handleShare(): Promise<void> {
    if (!wrapper.current) {
      toast.error("Canvas not ready");
      return;
    }
    try {
      const dataUrl = await captureFlowAsDataUrl(wrapper.current, { scale: 3, type: "png" });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `architecture-${Date.now()}.png`, { type: blob.type });

      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await (navigator as any).share({
          files: [file],
          title: "Architecture",
          text: "Shared from ArchGuard AI",
        });
        toast.success("Shared successfully");
      } else if ((navigator as any).share) {
        await (navigator as any).share({
          title: "Architecture",
          text: "Architecture image",
          url: dataUrl,
        });
        toast.success("Shared successfully");
      } else {
        await downloadDataUrl(dataUrl, `architecture-${Date.now()}.png`);
        toast.success("Sharing unsupported — image downloaded instead");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to share image: " + String(err));
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="designer-header flex flex-nowrap items-center justify-between gap-2 border-b border-border bg-surface/70 px-4 py-2.5">
        <div className="designer-project-meta min-w-0 flex-1">
          <h1 className="designer-project-title whitespace-nowrap text-sm font-semibold tracking-tight">{ctx.name}</h1>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Badge variant="outline" className="designer-project-badge min-w-0 max-w-full whitespace-nowrap h-5 border-primary/30 text-[10px] text-primary">
              {ctx.cloud.toUpperCase()} • {ctx.pattern} • {ctx.scale} • {ctx.industry}
            </Badge>
            <button
              onClick={onEditContext}
              aria-label="Edit project setup"
              className="designer-project-settings rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Settings2 className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="designer-view-actions ml-auto mr-2 flex shrink-0 items-center gap-1 rounded-md bg-transparent text-foreground">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => zoomOut()} title="Zoom out">
            <ZoomOut className="size-4" />
          </Button>
          <div className="flex min-w-[3rem] items-center justify-center text-[12px] font-medium text-muted-foreground">
            {zoomPct}%
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => zoomIn()} title="Zoom in">
            <ZoomIn className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => fitView({ padding: 0.2 })}
            title="Fit view"
          >
            <Scan className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 px-2.5 text-[11px] font-medium"
            onClick={() => setCanvasTheme((t) => (t === "dark" ? "light" : "dark"))}
            title={`Switch canvas to ${canvasTheme === "dark" ? "Light" : "Dark"} Mode`}
            aria-pressed={canvasTheme === "dark"}
          >
            {canvasTheme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            <span className="designer-theme-label hidden sm:inline">{canvasTheme === "dark" ? "Light" : "Dark"} Mode</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8", isLocked && "bg-primary/15 text-primary")}
            onClick={() => setIsLocked((locked) => !locked)}
            title={isLocked ? "Unlock canvas" : "Lock canvas"}
            aria-label={isLocked ? "Unlock canvas" : "Lock canvas"}
            aria-pressed={isLocked}
          >
            {isLocked ? <Lock className="size-4" /> : <Unlock className="size-4" />}
          </Button>
        </div>
        <div className="designer-export-actions flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <Button variant="ghost" size="sm" className="designer-icon-action" onClick={handleSave} title="Save image">
            <Save className="size-4" /><span className="designer-action-label">Save</span>
          </Button>
          <Button variant="ghost" size="sm" className="designer-icon-action" onClick={handleShare} title="Share image">
            <Share2 className="size-4" /><span className="designer-action-label">Share</span>
          </Button>
          <Button variant="ghost" size="sm" className="designer-icon-action" onClick={handleExport} title="Export image (PNG/JPG)">
            <Download className="size-4" /><span className="designer-action-label">Export</span>
          </Button>
          <Button variant="ghost" size="sm" className="designer-icon-action" onClick={onNewProject} disabled={isLocked}>
            <FilePlus2 className="size-4" /><span className="designer-action-label">New</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFailureOpen(true)}
            className="designer-icon-action designer-failure-action border-destructive/40 text-destructive hover:bg-destructive/8"
            title="Simulate a component failure and assess impact"
          >
            <ZapOff className="size-4" /><span className="designer-action-label">Simulate Failure</span>
          </Button>
          <Button size="sm" className="designer-icon-action designer-review-action" onClick={() => (isReviewPanelOpen ? setIsReviewPanelOpen(false) : runReview())}>
            <Sparkles className="size-4" /><span className="designer-action-label">Review Architecture</span>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <ComponentLibrary
            cloud={ctx.cloud}
          collapsed={libCollapsed}
          onToggle={() => setLibCollapsed((c) => !c)}
          onAdd={addFromLibrary}
        />

        <div
          ref={wrapper}
          className="relative min-w-0 flex-1 overflow-hidden transition-[background-color,background-image] duration-300"
          style={{
            backgroundColor: canvasPalette.canvas,
            backgroundImage: canvasPalette.overlay,
          }}
        >
          <div className="designer-canvas-toolbar absolute left-1/2 top-3 z-10 flex w-max max-w-[calc(100%-1rem)] -translate-x-1/2 flex-nowrap items-center justify-start gap-1 overflow-x-auto overflow-y-hidden rounded-lg border border-border bg-surface/95 p-1 panel-shadow backdrop-blur sm:gap-1 sm:p-1.5">
            <ToolButton active={tool === "select"} onClick={() => setTool("select")} label="Select">
              <MousePointer2 className="size-4" />
            </ToolButton>
            <ToolButton active={tool === "pan"} onClick={() => setTool("pan")} label="Pan">
              <Move className="size-4" />
            </ToolButton>
            <Divider />
            <ToolButton onClick={addText} label="Text" disabled={isLocked}>
              <TypeIcon className="size-4" />
            </ToolButton>
            <ToolButton onClick={addGroup} label="Group" disabled={isLocked}>
              <BoxSelect className="size-4" />
            </ToolButton>
            <Divider />
            <ToolButton onClick={undo} label="Undo" disabled={isLocked}>
              <Undo2 className="size-4" />
            </ToolButton>
            <ToolButton onClick={redo} label="Redo" disabled={isLocked}>
              <Redo2 className="size-4" />
            </ToolButton>
            <Divider />

            <ToolButton
              id="auto-layout-trigger"
              label={`Auto layout ${layoutDirectionLabel}`}
              type="button"
              onClick={() => autoLayout()}
              disabled={isLocked}
            >
              <Wand2 className="size-4" />
            </ToolButton>
            <div className="inline-flex min-w-0 shrink-0 items-center gap-0.5 rounded-md border border-border bg-surface/95 p-0.5 sm:gap-1 sm:p-1">
              <button
                type="button"
                onClick={() => applyLayoutDirection("TB")}
                aria-pressed={layoutDirection === "TB"}
                disabled={isLocked}
                aria-label="Layout direction: Top to Down"
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-1.5 py-1 text-[10px] font-medium leading-none transition-colors sm:px-2.5 sm:text-[11px]",
                  layoutDirection === "TB"
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <ArrowDown aria-hidden="true" className="size-3 shrink-0 sm:size-3.5" />
                <span className="whitespace-nowrap">Top - Down</span>
              </button>
              <button
                type="button"
                onClick={() => applyLayoutDirection("LR")}
                aria-pressed={layoutDirection === "LR"}
                disabled={isLocked}
                aria-label="Layout direction: Left to Right"
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-1.5 py-1 text-[10px] font-medium leading-none transition-colors sm:px-2.5 sm:text-[11px]",
                  layoutDirection === "LR"
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <ArrowRight aria-hidden="true" className="size-3 shrink-0 sm:size-3.5" />
                <span className="whitespace-nowrap">Left - Right</span>
              </button>
            </div>
            <ToolButton onClick={fullscreen} label="Fullscreen">
              <Maximize2 className="size-4" />
            </ToolButton>
          </div>

          <ReactFlow
            style={{ background: "transparent" }}
            nodes={renderedNodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onBeforeDelete={onBeforeDelete}
            onDelete={onDelete}
            onEdgeClick={(_, edge) => {
              setSelectedEdgeId(edge.id);
              setSelectedNodeId(null);
            }}
            onNodeClick={(_, node) => {
              setSelectedEdgeId(null);
              if (node.type === "service") {
                setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
              } else {
                setSelectedNodeId(null);
              }
            }}
            onPaneClick={() => {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = isLocked || tool === "pan" ? "none" : "move";
            }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            panOnDrag={isLocked || tool === "pan" ? true : [1, 2]}
            selectionOnDrag={!isLocked && tool === "select"}
            nodesDraggable={!isLocked && tool === "select"}
            nodesConnectable={!isLocked && tool === "select"}
            elementsSelectable={!isLocked && tool === "select"}
            deleteKeyCode={["Backspace", "Delete"]}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color={canvasPalette.grid}
            />
          </ReactFlow>

          {selectedEdge && selectedEdgeType ? (
            <div className="absolute right-3 top-3 z-30 w-56 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-semibold">Connection Semantics</div>
                  <div className="text-[10px] text-muted-foreground">Choose how these services communicate</div>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Close connection editor"
                  onClick={() => setSelectedEdgeId(null)}
                >
                  ×
                </button>
              </div>
              <select
                value={selectedEdgeType}
                disabled={isLocked}
                onChange={(event) => updateSelectedEdgeType(event.target.value as ConnectionType)}
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-[11px] outline-none focus:border-primary"
                aria-label="Connection type"
              >
                {CONNECTION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          ) : null}

          {nodes.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="rounded-lg border border-dashed border-border bg-surface/70 px-4 py-2 text-xs text-muted-foreground">
                Drag services from the component library onto the canvas to start designing
              </p>
            </div>
          ) : null}

          {/* Trade-off Card */}
          {selectedNodeId && (() => {
            const selectedNode = nodes.find((n) => n.id === selectedNodeId);
            if (selectedNode && selectedNode.type === "service") {
              const d = selectedNode.data as { serviceId: string; label: string; cloud?: CloudId };
              const svc = findService(d.cloud || ctx.cloud, d.serviceId);
              if (!svc) return null;
              return <TradeoffCard svc={svc} onClose={() => setSelectedNodeId(null)} />;
            }
            return null;
          })()}

          <FloatingAiReviewer result={result} ctx={ctx} />
        </div>

        <ReviewPanel
          result={result}
          ctx={ctx}
          cost={cost}
          open={isReviewPanelOpen}
          collapsed={false}
          width={reviewWidth}
          onResize={(w) => setReviewWidth(Math.min(MAX_REVIEW_W, Math.max(MIN_REVIEW_W, w)))}
          nodeCount={nodes.filter((n) => n.type === "service").length}
          onFocusLibrary={() => setLibCollapsed(false)}
          onToggle={() => setIsReviewPanelOpen((open) => !open)}
          onRun={runReview}
          onScoreTabClick={runReview}
        />

        {/* Failure Simulator Modal */}
        {failureOpen && (
          <FailureSimulator
            graph={buildGraph()}
            onClose={() => setFailureOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

const ToolButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    active?: boolean;
    label: string;
  }
>(({ children, active, label, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      title={label}
      aria-label={label}
      className={cn(
        "designer-toolbar-button flex size-7 shrink-0 items-center justify-center rounded-md text-foreground/90 transition-colors hover:bg-accent hover:text-foreground",
        active && "bg-primary/15 text-primary",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
ToolButton.displayName = "ToolButton";

function Divider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-border" />;
}
