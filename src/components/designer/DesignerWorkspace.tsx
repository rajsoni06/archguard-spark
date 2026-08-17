import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
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
  Share2,
  Download,
  Settings2,
  Sparkles,
  Type as TypeIcon,
  Undo2,
  Wand2,
  FilePlus2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BOUNDARY_KINDS, findService, type CloudId } from "@/lib/catalog";
import { analyzeArchitecture, type AnalysisResult, type ProjectContext } from "@/lib/ruleEngine";
import { computeAutoLayout } from "@/lib/autoLayout";
import { estimateCost } from "@/lib/costEngine";
import { loadGraph, saveGraph } from "@/lib/session";
import { BoundaryNode, ServiceNode, TextNode } from "./nodes";
import { ComponentLibrary } from "./ComponentLibrary";
import { ReviewPanel } from "./ReviewPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nodeTypes = { service: ServiceNode, boundary: BoundaryNode, text: TextNode };

let idCounter = 0;
const nextId = () => `n${++idCounter}_${Date.now().toString(36)}`;

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
  const [reviewCollapsed, setReviewCollapsed] = useState(false);
  const [tool, setTool] = useState<"select" | "pan">("select");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const past = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const future = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow();

  // Restore the in-progress diagram when the user returns to the designer.
  useEffect(() => {
    const stored = loadGraph();
    if (stored?.nodes?.length || stored?.edges?.length) {
      setNodes(stored.nodes as Node[]);
      setEdges(stored.edges as Edge[]);
      setTimeout(() => fitView({ padding: 0.2 }), 80);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveGraph({ nodes, edges });
  }, [nodes, edges]);

  const cost = useMemo(
    () =>
      estimateCost(
        nodes
          .filter((n) => n.type === "service")
          .map((n) => {
            const d = n.data as { serviceId: string; label: string };
            const svc = findService(ctx.cloud, d.serviceId);
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
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push({ nodes, edges });
    setNodes(prev.nodes);
    setEdges(prev.edges);
  };

  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push({ nodes, edges });
    setNodes(next.nodes);
    setEdges(next.edges);
  };

  const onConnect = useCallback(
    (params: Connection) => {
      snapshot();
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            animated: true,
            style: { stroke: "var(--primary)" },
            markerEnd: { type: MarkerType.ArrowClosed, color: "var(--primary)" },
          },
          eds,
        ),
      );
    },
    [setEdges, snapshot],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/archguard");
      if (!raw) return;
      const payload = JSON.parse(raw) as { kind: string; id: string; label: string };
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      snapshot();

      if (payload.kind === "boundary") {
        setNodes((nds) => [
          {
            id: nextId(),
            type: "boundary",
            position,
            data: { kind: payload.id, label: payload.label },
            style: { width: 380, height: 240 },
            zIndex: -1,
            selectable: true,
          } as Node,
          ...nds,
        ]);
        return;
      }

      setNodes((nds) => [
        ...nds,
        {
          id: nextId(),
          type: "service",
          position,
          data: { serviceId: payload.id, cloud: ctx.cloud as CloudId, label: payload.label },
        } as Node,
      ]);
    },
    [ctx.cloud, screenToFlowPosition, setNodes, snapshot],
  );

  const boundaryOf = useCallback(
    (node: Node) => {
      const boundaries = nodes.filter((n) => n.type === "boundary");
      const inside = boundaries.filter((b) => {
        const w = Number(b.style?.width ?? 380);
        const h = Number(b.style?.height ?? 240);
        return (
          node.position.x >= b.position.x &&
          node.position.x <= b.position.x + w &&
          node.position.y >= b.position.y &&
          node.position.y <= b.position.y + h
        );
      });
      const priority = ["database-layer", "private-subnet", "public-subnet", "k8s", "az", "vpc", "region"];
      for (const kind of priority) {
        if (inside.some((b) => (b.data as { kind: string }).kind === kind)) return kind;
      }
      return inside[0] ? ((inside[0].data as { kind: string }).kind ?? undefined) : undefined;
    },
    [nodes],
  );

  const runReview = () => {
    const graph = {
      nodes: nodes
        .filter((n) => n.type === "service")
        .map((n) => {
          const d = n.data as { serviceId: string; label: string };
          const svc = findService(ctx.cloud, d.serviceId);
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
    setReviewCollapsed(false);
    toast.success(`Review complete — ${analysis.overall}/100 · ${analysis.maturity}`);
  };

  const autoLayout = () => {
    const services = nodes.filter((n) => n.type === "service");
    if (services.length < 2) {
      toast.error("Add at least two components before running Auto Layout.");
      return;
    }
    snapshot();

    const layoutNodes = services.map((n) => {
      const d = n.data as { serviceId: string; label: string };
      const svc = findService(ctx.cloud, d.serviceId);
      return { id: n.id, label: d.label, caps: svc?.caps ?? [] };
    });

    const { positions, edges: flowEdges, warnings, summary } = computeAutoLayout(layoutNodes, ctx);

    setNodes((nds) =>
      nds.map((n) => (positions[n.id] ? { ...n, position: positions[n.id]! } : n)),
    );

    setEdges(
      flowEdges.map((e, i) => ({
        id: `auto-${i}-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        animated: true,
        style: { stroke: "var(--primary)" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--primary)" },
      })),
    );

    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 80);

    if (warnings.length) {
      warnings.forEach((w) => toast.warning(w, { duration: 8000 }));
    }
    toast.success("Architecture flow generated successfully based on your selected components and project requirements.", {
      description: summary || undefined,
      action: { label: "Undo Auto Layout", onClick: () => undo() },
      duration: 10000,
    });
  };

  const addText = () => {
    snapshot();
    setNodes((nds) => [
      ...nds,
      { id: nextId(), type: "text", position: { x: 60, y: 40 }, data: { label: "Label" } } as Node,
    ]);
  };

  const addGroup = () => {
    snapshot();
    setNodes((nds) => [
      {
        id: nextId(),
        type: "boundary",
        position: { x: 40, y: 40 },
        data: { kind: "service-group", label: BOUNDARY_KINDS[6]!.label },
        style: { width: 400, height: 260 },
        zIndex: -1,
      } as Node,
      ...nds,
    ]);
  };

  const fullscreen = () => {
    const el = wrapper.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  };

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
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => toast.success("Architecture saved")}>
            <Save className="size-4" /> Save
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toast.success("Share link copied")}>
            <Share2 className="size-4" /> Share
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toast.success("Export queued (PNG / PDF)")}>
            <Download className="size-4" /> Export
          </Button>
          <Button variant="ghost" size="sm" onClick={onNewProject}>
            <FilePlus2 className="size-4" /> New
          </Button>
          <Button size="sm" onClick={runReview}>
            <Sparkles className="size-4" /> Review Architecture
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <ComponentLibrary cloud={ctx.cloud} collapsed={libCollapsed} onToggle={() => setLibCollapsed((v) => !v)} />

        <div ref={wrapper} className="relative min-w-0 flex-1 bg-background">
          <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-border bg-surface/95 p-1 panel-shadow backdrop-blur">
            <ToolButton active={tool === "select"} onClick={() => setTool("select")} label="Select">
              <MousePointer2 className="size-4" />
            </ToolButton>
            <ToolButton active={tool === "pan"} onClick={() => setTool("pan")} label="Pan">
              <Move className="size-4" />
            </ToolButton>
            <Divider />
            <ToolButton onClick={addText} label="Text"><TypeIcon className="size-4" /></ToolButton>
            <ToolButton onClick={addGroup} label="Group"><Maximize2 className="size-4" /></ToolButton>
            <Divider />
            <ToolButton onClick={undo} label="Undo"><Undo2 className="size-4" /></ToolButton>
            <ToolButton onClick={redo} label="Redo"><Redo2 className="size-4" /></ToolButton>
            <Divider />
            <ToolButton onClick={() => zoomOut()} label="Zoom out"><span className="text-sm">−</span></ToolButton>
            <ToolButton onClick={() => zoomIn()} label="Zoom in"><span className="text-sm">+</span></ToolButton>
            <ToolButton onClick={autoLayout} label="Auto layout"><Wand2 className="size-4" /></ToolButton>
            <ToolButton onClick={fullscreen} label="Fullscreen"><Maximize2 className="size-4" /></ToolButton>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            nodeTypes={nodeTypes}
            panOnDrag={tool === "pan" ? true : [1, 2]}
            selectionOnDrag={tool === "select"}
            deleteKeyCode={["Backspace", "Delete"]}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--grid)" />
            <Controls className="!border-border !bg-surface" />
          </ReactFlow>

          {nodes.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="rounded-lg border border-dashed border-border bg-surface/70 px-4 py-2 text-xs text-muted-foreground">
                Drag services from the component library onto the canvas to start designing
              </p>
            </div>
          ) : null}
        </div>

        <ReviewPanel
          result={result}
          ctx={ctx}
          cost={cost}
          collapsed={reviewCollapsed}
          onToggle={() => setReviewCollapsed((v) => !v)}
          onRun={runReview}
        />
      </div>
    </div>
  );
}

function ToolButton({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        active && "bg-primary/15 text-primary",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-border" />;
}