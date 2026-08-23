import { Handle, NodeResizer, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { AlertTriangle, Trash2, GripHorizontal } from "lucide-react";
import { BOUNDARY_KINDS, findService, getBoundaryLabel, type CloudId } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const DELETE_NODE_EVENT = "archguard:delete-node";

/** Small, unobtrusive delete affordance shown on hover or selection. */
function DeleteControl({ id, selected, locked }: { id: string; selected?: boolean; locked: boolean }) {
  if (locked) return null;
  return (
    <button
      type="button"
      aria-label="Delete component"
      title="Delete component"
      onClick={(e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent(DELETE_NODE_EVENT, { detail: { id } }));
      }}
      className={cn(
        "nodrag absolute bottom-1 right-1 z-20 flex size-5 items-center justify-center rounded-full border border-destructive/40 bg-background text-destructive shadow-sm transition-opacity hover:bg-destructive hover:text-destructive-foreground",
        selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
      )}
    >
      <Trash2 className="size-3" />
    </button>
  );
}

export interface ServiceNodeData extends Record<string, unknown> {
  serviceId: string;
  cloud: CloudId;
  label: string;
  locked?: boolean;
  status?: "ok" | "warning" | "critical";
  problems?: CanvasProblem[];
}

export interface CanvasProblem {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  why: string;
  recommendation: string;
}

export function ServiceNode({ id, data, selected }: NodeProps) {
  const d = data as ServiceNodeData;
  const svc = findService(d.cloud, d.serviceId);
  const Icon = svc?.icon;
  const problems = d.problems ?? [];

  return (
    <div
      className={cn(
        "group relative min-w-[164px] rounded-lg border bg-card px-3 py-2.5 transition-all",
        selected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/50",
        d.status === "warning" && "border-warning/70",
        d.status === "critical" && "border-destructive/70",
      )}
      style={{ boxShadow: "0 6px 18px -12px oklch(0 0 0 / 0.9)" }}
    >
      <DeleteControl id={id} selected={selected} locked={d.locked === true} />
      {problems.length ? <ProblemIndicator problems={problems} /> : null}
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className="connection-handle--visible !size-0.5 !border-none !bg-primary/50"
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="connection-handle--visible !left-0 !top-1/2 !size-0.5 !border-none !bg-primary/50"
      />
      <Handle
        id="top-left"
        type="target"
        position={Position.Top}
        className="connection-handle--corner connection-handle--corner-top-left !left-0 !top-0 !size-0.5 !border-none !bg-primary/40"
      />
      <Handle
        id="top-right"
        type="target"
        position={Position.Top}
        className="connection-handle--corner connection-handle--corner-top-right !left-auto !right-0 !top-0 !size-0.5 !border-none !bg-primary/40"
      />
      <Handle
        id="top-quarter-left"
        type="target"
        position={Position.Top}
        className="connection-handle--visible !left-1/4 !top-0 !size-0.5 !-translate-x-1/2 !translate-y-0 !border-none !bg-primary/40"
      />
      <Handle
        id="top-quarter-right"
        type="target"
        position={Position.Top}
        className="connection-handle--visible !left-3/4 !top-0 !size-0.5 !-translate-x-1/2 !translate-y-0 !border-none !bg-primary/40"
      />
      <Handle
        id="top-eighth-left"
        type="target"
        position={Position.Top}
        className="!left-[12.5%] !top-0 !size-0.5 !-translate-x-1/2 !translate-y-0 !border-none !bg-primary/40"
      />
      <Handle
        id="top-eighth-right"
        type="target"
        position={Position.Top}
        className="!left-[87.5%] !top-0 !size-0.5 !-translate-x-1/2 !translate-y-0 !border-none !bg-primary/40"
      />
      <Handle id="top-three-eighths-left" type="target" position={Position.Top} className="!left-[37.5%] !top-0 !size-0.5 !-translate-x-1/2 !translate-y-0 !border-none !bg-primary/40" />
      <Handle id="top-three-eighths-right" type="target" position={Position.Top} className="!left-[62.5%] !top-0 !size-0.5 !-translate-x-1/2 !translate-y-0 !border-none !bg-primary/40" />
      <Handle
        id="left-quarter-top"
        type="target"
        position={Position.Left}
        className="!left-0 !top-[37.5%] !-translate-y-1/2 !size-0.5 !border-none !bg-primary/40"
      />
      <Handle
        id="left-quarter-bottom"
        type="target"
        position={Position.Left}
        className="!left-0 !top-[62.5%] !-translate-y-1/2 !size-0.5 !border-none !bg-primary/40"
      />
      <Handle
        id="left-eighth-top"
        type="target"
        position={Position.Left}
        className="!left-0 !top-[12.5%] !-translate-y-1/2 !size-0.5 !border-none !bg-primary/40"
      />
      <div className="flex items-center gap-2.5">
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-md"
          style={{
            backgroundColor: `color-mix(in oklab, ${cloudColor(d.cloud)} 18%, transparent)`,
            color: cloudColor(d.cloud),
          }}
        >
          {Icon ? <Icon className="size-4" /> : null}
        </div>
        <div className="min-w-0">
          <div
            className="truncate whitespace-nowrap text-[13px] font-medium leading-tight"
            title={d.label}
            aria-label={d.label}
          >
            {d.label}
          </div>
          <div
            className="truncate whitespace-nowrap text-[10px] uppercase tracking-wide text-muted-foreground"
            title={svc?.category ?? "Component"}
            aria-label={svc?.category ?? "Component"}
          >
            {svc?.category ?? "Component"}
          </div>
        </div>
      </div>
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="connection-handle--visible !size-0.5 !border-none !bg-primary/50"
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="connection-handle--visible !left-auto !right-0 !top-1/2 !size-0.5 !border-none !bg-primary/50"
      />
      <Handle
        id="bottom-left"
        type="source"
        position={Position.Bottom}
        className="connection-handle--corner connection-handle--corner-bottom-left !left-0 !bottom-0 !size-0.5 !border-none !bg-primary/40"
      />
      <Handle
        id="bottom-right"
        type="source"
        position={Position.Bottom}
        className="connection-handle--corner connection-handle--corner-bottom-right !left-auto !right-0 !bottom-0 !size-0.5 !border-none !bg-primary/40"
      />
      <Handle
        id="bottom-quarter-left"
        type="source"
        position={Position.Bottom}
        className="connection-handle--visible !left-1/4 !bottom-0 !size-0.5 !-translate-x-1/2 !translate-y-0 !border-none !bg-primary/40"
      />
      <Handle
        id="bottom-quarter-right"
        type="source"
        position={Position.Bottom}
        className="connection-handle--visible !left-3/4 !bottom-0 !size-0.5 !-translate-x-1/2 !translate-y-0 !border-none !bg-primary/40"
      />
      <Handle
        id="bottom-eighth-left"
        type="source"
        position={Position.Bottom}
        className="!left-[12.5%] !bottom-0 !size-0.5 !-translate-x-1/2 !translate-y-0 !border-none !bg-primary/40"
      />
      <Handle
        id="bottom-eighth-right"
        type="source"
        position={Position.Bottom}
        className="!left-[87.5%] !bottom-0 !size-0.5 !-translate-x-1/2 !translate-y-0 !border-none !bg-primary/40"
      />
      <Handle id="bottom-three-eighths-left" type="source" position={Position.Bottom} className="!left-[37.5%] !bottom-0 !size-0.5 !-translate-x-1/2 !translate-y-0 !border-none !bg-primary/40" />
      <Handle id="bottom-three-eighths-right" type="source" position={Position.Bottom} className="!left-[62.5%] !bottom-0 !size-0.5 !-translate-x-1/2 !translate-y-0 !border-none !bg-primary/40" />
      <Handle
        id="right-quarter-top"
        type="source"
        position={Position.Right}
        className="!left-auto !right-0 !top-[37.5%] !-translate-y-1/2 !size-0.5 !border-none !bg-primary/40"
      />
      <Handle
        id="right-quarter-bottom"
        type="source"
        position={Position.Right}
        className="!left-auto !right-0 !top-[62.5%] !-translate-y-1/2 !size-0.5 !border-none !bg-primary/40"
      />
      <Handle
        id="right-eighth-top"
        type="source"
        position={Position.Right}
        className="!left-auto !right-0 !top-[12.5%] !-translate-y-1/2 !size-0.5 !border-none !bg-primary/40"
      />
    </div>
  );
}

function cloudColor(cloud: CloudId) {
  return cloud === "aws" ? "var(--aws)" : cloud === "azure" ? "var(--azure)" : "var(--gcp)";
}

export interface BoundaryNodeData extends Record<string, unknown> {
  kind: string;
  label: string;
  cloud?: CloudId;
  locked?: boolean;
}

export function BoundaryNode({ id, data, selected }: NodeProps) {
  const d = data as BoundaryNodeData;
  const def = BOUNDARY_KINDS.find((b) => b.id === d.kind) ?? BOUNDARY_KINDS[0]!;
  const label = d.label || getBoundaryLabel(d.kind as any, d.cloud);

  return (
    <>
      <NodeResizer minWidth={180} minHeight={120} isVisible={selected && !d.locked} color="var(--primary)" />
      <div
        className="group size-full rounded-xl border-2 border-solid"
        style={{
          borderColor: `color-mix(in oklab, ${def.color} 55%, transparent)`,
          backgroundColor: `color-mix(in oklab, ${def.color} 7%, transparent)`,
        }}
      >
        <DeleteControl id={id} selected={selected} locked={d.locked === true} />
        <span
          className="absolute -top-2.5 left-3 rounded-full border bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
          style={{
            borderColor: `color-mix(in oklab, ${def.color} 45%, transparent)`,
            color: def.color,
          }}
        >
          {label}
        </span>
      </div>
    </>
  );
}

function ProblemIndicator({ problems }: { problems: CanvasProblem[] }) {
  const highest = problems.some((problem) => problem.severity === "critical")
    ? "critical"
    : problems.some((problem) => problem.severity === "high")
      ? "high"
      : "medium";
  const tone = highest === "critical" ? "text-destructive" : "text-warning";

  return (
    <div className="absolute -right-2.5 -top-2.5 z-40">
      <button
        type="button"
        aria-label={`${problems.length} architecture problem${problems.length === 1 ? "" : "s"}`}
        title="View architecture problems"
        className={cn(
          "peer nodrag flex size-5 items-center justify-center rounded-full border bg-card shadow-sm transition-transform hover:scale-110",
          highest === "critical" ? "border-destructive/50" : "border-warning/60",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <AlertTriangle className={cn("size-3", tone)} />
      </button>
        <div className="archguard-problem-panel pointer-events-none absolute right-0 top-6 z-[2147483647] w-64 origin-top-right scale-0 rounded-lg border border-border bg-popover p-3 text-popover-foreground opacity-0 shadow-xl transition-all duration-150 peer-focus:pointer-events-auto peer-focus:scale-100 peer-focus:opacity-100">
        <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-2">
          <span className="text-[11px] font-semibold">Architecture Problems</span>
          <span className="text-[10px] text-muted-foreground">{problems.length}</span>
        </div>
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {problems.map((problem) => (
            <div key={problem.id} className="space-y-1.5 text-[11px] leading-relaxed">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">{problem.title}</span>
                <span className={cn("shrink-0 text-[9px] font-bold uppercase", problem.severity === "critical" || problem.severity === "high" ? "text-destructive" : "text-warning")}>
                  {problem.severity}
                </span>
              </div>
              <p className="text-foreground/80">{problem.description}</p>
              <p><span className="font-semibold">Why this matters:</span> {problem.why}</p>
              <p><span className="font-semibold">Recommendation:</span> {problem.recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface TextNodeData extends Record<string, unknown> {
  label: string;
  locked?: boolean;
}

export function TextNode({ id, data, selected }: NodeProps) {
  const d = data as TextNodeData;
  const { updateNodeData } = useReactFlow();

  return (
    <div
      className={cn(
        "group relative flex items-center justify-center rounded-md text-[13px] font-medium text-foreground p-1.5",
        selected ? "ring-1 ring-primary/50 bg-background/50" : "hover:bg-background/30"
      )}
    >
      <DeleteControl id={id} selected={selected} locked={d.locked === true} />
      
      <div className="absolute -top-5 left-1/2 flex -translate-x-1/2 cursor-grab items-center justify-center rounded border bg-card p-0.5 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        <GripHorizontal className="size-3" />
      </div>

      <div className="relative flex min-w-[60px] items-center justify-center">
        <span className="invisible whitespace-pre px-1">
          {d.label || "Type..."}
        </span>
        <input
          value={d.label}
          onChange={(e) => updateNodeData(id, { label: e.target.value })}
          readOnly={d.locked}
          className="nodrag absolute inset-0 size-full bg-transparent px-1 text-center outline-none"
          placeholder="Type..."
        />
      </div>
    </div>
  );
}
