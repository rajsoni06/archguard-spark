"use client";

import {
  Background,
  BackgroundVariant,
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
import { loadGraph, saveGraph } from "@/lib/session";
import { BoundaryNode, DELETE_NODE_EVENT, ServiceNode, TextNode } from "./nodes";
import { ComponentLibrary, type LibraryPayload } from "./ComponentLibrary";
import { ReviewPanel } from "./ReviewPanel";
import { FailureSimulator } from "./FailureSimulator";
import { TradeoffCard } from "./TradeoffCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nodeTypes = { service: ServiceNode, boundary: BoundaryNode, text: TextNode };

let idCounter = 0;
const nextId = () => `n${++idCounter}_${Date.now().toString(36)}`;

const NODE_W = 176;
const NODE_H = 66;
const GAP = 42;
const MIN_REVIEW_W = 300;
const MAX_REVIEW_W = 620;
const CANVAS_THEME_STORAGE_KEY = "archguard-canvas-theme";
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
  const [layoutDirection, setLayoutDirection] = useState<"LR" | "TB">("LR");
  const wrapper = useRef<HTMLDivElement>(null);
  const past = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const future = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const graphRef = useRef<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const pendingDelete = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
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
    try {
      window.localStorage.setItem(CANVAS_LOCK_STORAGE_KEY, String(isLocked));
    } catch {
      // ignore storage failures
    }
  }, [isLocked]);

  const canvasPalette = CANVAS_THEMES[canvasTheme];
  const renderedNodes = useMemo(
    () =>
      isLocked
        ? nodes.map((node) => ({
            ...node,
            data: { ...node.data, locked: true },
          }))
        : nodes,
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
      commitNodes(stored.nodes as Node[]);
      setEdges(stored.edges as Edge[]);
      setTimeout(() => fitView({ padding: 0.2 }), 80);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitNodes]);

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
    saveGraph({ nodes, edges });
  }, [nodes, edges]);

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

  const restore = useCallback(
    (state: { nodes: Node[]; edges: Edge[] }) => {
      commitNodes(state.nodes);
      setEdges(state.edges);
    },
    [commitNodes, setEdges],
  );

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
      const label =
        removed.length === 1
          ? `${(removed[0]!.data as { label?: string }).label ?? "Component"} removed from architecture.`
          : `${removed.length} components removed from architecture.`;
      toast(label, {
        description: "Connected links were removed too.",
        action: { label: "Undo", onClick: () => restore(before) },
        duration: 7000,
      });
    },
    [isLocked, restore],
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
      toast.success(`${payload.label} added to canvas`, { duration: 1800 });
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
        const sourceCandidates = ["right", "bottom"];
        const targetCandidates = ["left", "top"];
        const handlePoint = (n: Node, h: string) => {
          const w = Number(n.style?.width ?? NODE_W);
          const hgt = Number(n.style?.height ?? NODE_H);
          const cx = n.position.x + w / 2;
          const cy = n.position.y + hgt / 2;
          switch (h) {
            case "top":
              return { x: cx, y: n.position.y };
            case "bottom":
              return { x: cx, y: n.position.y + hgt };
            case "left":
              return { x: n.position.x, y: cy };
            default:
              return { x: n.position.x + w, y: cy };
          }
        };

        let best: { s?: string; t?: string; d?: number } = { d: Infinity };
        for (const sHc of sourceCandidates) {
          for (const tHc of targetCandidates) {
            const p1 = handlePoint(src, sHc);
            const p2 = handlePoint(tgt, tHc);
            const dd = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            // bias toward horizontal when dx dominates, vertical when dy dominates
            let bias = 0;
            if (Math.abs(dx) > Math.abs(dy) * 1.2) {
              if (sHc === "right" && tHc === "left") bias -= 8;
            } else if (Math.abs(dy) > Math.abs(dx) * 1.2) {
              if (sHc === "bottom" && tHc === "top") bias -= 8;
            }
            const score = dd + bias;
            if (score < (best.d ?? Infinity)) best = { s: sHc, t: tHc, d: score };
          }
        }
        return { sourceHandle: best.s, targetHandle: best.t } as {
          sourceHandle?: string;
          targetHandle?: string;
        };
      };

      const handles = pickHandles(params.source, params.target);
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            ...handles,
            type: "smoothstep",
            animated: true,
            style: { stroke: connectionColor(eds.length) },
            markerEnd: { type: MarkerType.ArrowClosed, color: connectionColor(eds.length) },
          },
          eds,
        ),
      );
    },
    [isLocked, setEdges, snapshot, nodes],
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

  // Build the ArchGraph for the Failure Simulator
  const buildGraph = (): ArchGraph => ({
    nodes: nodes
      .filter((n) => n.type === "service")
      .map((n) => {
        const d = n.data as { serviceId: string; label: string; cloud?: CloudId };
        const svc = findService(d.cloud || ctx.cloud, d.serviceId);
        return { id: n.id, serviceId: d.serviceId, label: d.label, caps: svc?.caps ?? [], boundary: boundaryOf(n) };
      }),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  });

  const runReview = () => {
    if (nodes.filter((n) => n.type === "service").length === 0) {
      toast.error("Architecture is empty", {
        description: "Add at least one component to the canvas before reviewing your architecture.",
        action: { label: "Add Components", onClick: () => setLibCollapsed(false) },
      });
      return;
    }
    const graph = {
      nodes: nodes
        .filter((n) => n.type === "service")
        .map((n) => {
          const d = n.data as { serviceId: string; label: string; cloud?: CloudId };
          const svc = findService(d.cloud || ctx.cloud, d.serviceId);
          return {
            id: n.id,
            serviceId: d.serviceId,
            label: d.label,
            caps: svc?.caps ?? [],
            boundary: boundaryOf(n),
          };
        }),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    };
    const analysis = analyzeArchitecture(graph, ctx);
    setResult(analysis);
    setIsReviewPanelOpen(true);
    toast.success(`Review complete — ${analysis.overall}/100 · ${analysis.maturity}`);
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
      const tH = NODE_H;

      const handlePoint = (pos: { x: number; y: number }, h: string) => {
        const cx = pos.x + sW / 2;
        const cy = pos.y + sH / 2;
        switch (h) {
          case "top":    return { x: cx, y: pos.y };
          case "bottom": return { x: cx, y: pos.y + tH };
          case "left":   return { x: pos.x, y: cy };
          default:       return { x: pos.x + tW, y: cy };
        }
      };

      const srcPos = src.position;
      const tgtPos = tgt.position;

      // Determine directional relationship between the two nodes
      const dx = (tgtPos.x + tW / 2) - (srcPos.x + sW / 2);
      const dy = (tgtPos.y + tH / 2) - (srcPos.y + sH / 2);
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      let preferredSrc: string;
      let preferredTgt: string;

      if (activeDirection === "LR") {
        // Primary: Right → Left (horizontal flow)
        // Only fall back to vertical handles if nodes are nearly on the same X
        if (absDx >= absDy * 0.5) {
          preferredSrc = "right";
          preferredTgt = "left";
        } else {
          preferredSrc = "bottom";
          preferredTgt = "top";
        }
      } else {
        // TB: Primary: Bottom → Top (vertical flow)
        // Only fall back to horizontal handles if nodes are nearly on the same Y
        if (absDy >= absDx * 0.5) {
          preferredSrc = "bottom";
          preferredTgt = "top";
        } else {
          preferredSrc = "right";
          preferredTgt = "left";
        }
      }

      // If the preferred handle combination is already heavily used,
      // compute an alternative by slightly rotating the preference.
      const srcUsage = handleUsage.get(`${srcId}-${preferredSrc}`) ?? 0;
      const tgtUsage = handleUsage.get(`${tgtId}-${preferredTgt}`) ?? 0;

      let finalSrc = preferredSrc;
      let finalTgt = preferredTgt;

      // When a handle is overloaded (≥2 edges), pick the best available alternative
      if (srcUsage >= 2 || tgtUsage >= 2) {
        const sourceHandles = ["right", "bottom"];
        const targetHandles = ["left", "top"];
        let bestScore = Infinity;

        for (const sHc of sourceHandles) {
          for (const tHc of targetHandles) {
            const p1 = handlePoint(srcPos, sHc);
            const p2 = handlePoint(tgtPos, tHc);
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const su = handleUsage.get(`${srcId}-${sHc}`) ?? 0;
            const tu = handleUsage.get(`${tgtId}-${tHc}`) ?? 0;
            const score = dist + su * 200 + tu * 200
              + (sHc === preferredSrc ? 0 : 100)
              + (tHc === preferredTgt ? 0 : 100);
            if (score < bestScore) {
              bestScore = score;
              finalSrc = sHc;
              finalTgt = tHc;
            }
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
        type: "smoothstep",
        pathOptions: { offset: 18, borderRadius: 10 },
        animated: true,
        style: { stroke: connectionColor(i) },
        markerEnd: { type: MarkerType.ArrowClosed, color: connectionColor(i) },
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
          data: { kind: "service-group", label: getBoundaryLabel("service-group", ctx.cloud), cloud: ctx.cloud },
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
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/70 px-4 py-2.5">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight">{ctx.name}</h1>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Badge variant="outline" className="h-5 border-primary/30 text-[10px] text-primary">
              {ctx.cloud.toUpperCase()} • {ctx.pattern} • {ctx.scale} • {ctx.industry}
            </Badge>
            <button
              onClick={onEditContext}
              aria-label="Edit project setup"
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Settings2 className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-transparent text-foreground ml-auto mr-4">
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
            <span className="hidden sm:inline">{canvasTheme === "dark" ? "Light" : "Dark"} Mode</span>
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
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={handleSave} title="Save image">
            <Save className="size-4" /> Save
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare} title="Share image">
            <Share2 className="size-4" /> Share
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport} title="Export image (PNG/JPG)">
            <Download className="size-4" /> Export
          </Button>
          <Button variant="ghost" size="sm" onClick={onNewProject} disabled={isLocked}>
            <FilePlus2 className="size-4" /> New
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFailureOpen(true)}
            className="border-destructive/40 text-destructive hover:bg-destructive/8"
            title="Simulate a component failure and assess impact"
          >
            <ZapOff className="size-4" /> Simulate Failure
          </Button>
          <Button size="sm" onClick={() => (isReviewPanelOpen ? setIsReviewPanelOpen(false) : runReview())}>
            <Sparkles className="size-4" /> Review Architecture
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
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
          <div className="absolute left-1/2 top-3 z-10 flex w-max max-w-[calc(100%-1rem)] -translate-x-1/2 flex-nowrap items-center justify-start gap-0.5 overflow-x-auto overflow-y-hidden rounded-lg border border-border bg-surface/95 p-1 panel-shadow backdrop-blur sm:gap-1 sm:p-1.5">
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
            onNodeClick={(_, node) => {
              if (node.type === "service") {
                setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
              } else {
                setSelectedNodeId(null);
              }
            }}
            onPaneClick={() => setSelectedNodeId(null)}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = isLocked || tool === "pan" ? "none" : "move";
            }}
            nodeTypes={nodeTypes}
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
          onToggle={() => setIsReviewPanelOpen(false)}
          onRun={runReview}
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
        "flex size-7 shrink-0 items-center justify-center rounded-md text-foreground/90 transition-colors hover:bg-accent hover:text-foreground",
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
