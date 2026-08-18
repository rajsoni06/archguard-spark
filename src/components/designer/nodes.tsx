import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import { BOUNDARY_KINDS, findService, type CloudId } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const DELETE_NODE_EVENT = "archguard:delete-node";

/** Small, unobtrusive delete affordance shown on hover or selection. */
function DeleteControl({ id, selected }: { id: string; selected?: boolean }) {
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
        "nodrag absolute -right-2.5 -top-2.5 z-20 flex size-5 items-center justify-center rounded-full border border-destructive/40 bg-background text-destructive shadow-sm transition-opacity hover:bg-destructive hover:text-destructive-foreground",
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
  status?: "ok" | "warning" | "critical";
}

export function ServiceNode({ id, data, selected }: NodeProps) {
  const d = data as ServiceNodeData;
  const svc = findService(d.cloud, d.serviceId);
  const Icon = svc?.icon;

  return (
    <div
      className={cn(
        "group relative min-w-[164px] rounded-lg border bg-card px-3 py-2.5 transition-all",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50",
        d.status === "warning" && "border-warning/70",
        d.status === "critical" && "border-destructive/70",
      )}
      style={{ boxShadow: "0 6px 18px -12px oklch(0 0 0 / 0.9)" }}
    >
      <DeleteControl id={id} selected={selected} />
      <Handle type="target" position={Position.Top} className="!size-2 !border-none !bg-primary/70" />
      <Handle type="target" position={Position.Left} className="!size-2 !border-none !bg-primary/70" />
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
          <div className="truncate text-[13px] font-medium leading-tight">{d.label}</div>
          <div className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
            {svc?.category ?? "Component"}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!size-2 !border-none !bg-primary/70" />
      <Handle type="source" position={Position.Right} className="!size-2 !border-none !bg-primary/70" />
    </div>
  );
}

function cloudColor(cloud: CloudId) {
  return cloud === "aws" ? "var(--aws)" : cloud === "azure" ? "var(--azure)" : "var(--gcp)";
}

export interface BoundaryNodeData extends Record<string, unknown> {
  kind: string;
  label: string;
}

export function BoundaryNode({ id, data, selected }: NodeProps) {
  const d = data as BoundaryNodeData;
  const def = BOUNDARY_KINDS.find((b) => b.id === d.kind) ?? BOUNDARY_KINDS[0]!;

  return (
    <>
      <NodeResizer minWidth={180} minHeight={120} isVisible={selected} color="var(--primary)" />
      <div
        className="group size-full rounded-xl border-2 border-dashed"
        style={{
          borderColor: `color-mix(in oklab, ${def.color} 55%, transparent)`,
          backgroundColor: `color-mix(in oklab, ${def.color} 7%, transparent)`,
        }}
      >
        <DeleteControl id={id} selected={selected} />
        <span
          className="absolute -top-2.5 left-3 rounded-full border bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
          style={{ borderColor: `color-mix(in oklab, ${def.color} 45%, transparent)`, color: def.color }}
        >
          {d.label}
        </span>
      </div>
    </>
  );
}

export interface TextNodeData extends Record<string, unknown> {
  label: string;
}

export function TextNode({ data, selected }: NodeProps) {
  const d = data as TextNodeData;
  return (
    <div
      className={cn(
        "rounded-md px-2 py-1 text-[13px] font-medium text-muted-foreground",
        selected && "ring-1 ring-primary/50",
      )}
    >
      {d.label}
    </div>
  );
}