import { ChevronLeft, ChevronRight, Layers, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { BOUNDARY_KINDS, CLOUDS, type CloudId, type ServiceDef } from "@/lib/catalog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface LibraryPayload {
  kind: "service" | "boundary";
  id: string;
  label: string;
}

interface Props {
  cloud: CloudId;
  collapsed: boolean;
  onToggle: () => void;
  /** Click-to-add: places the component on the canvas at a free position. */
  onAdd: (payload: LibraryPayload) => void;
}

export function ComponentLibrary({ cloud, collapsed, onToggle, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const def = CLOUDS[cloud];

  const categories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return def.categories;
    return def.categories
      .map((c) => ({ ...c, services: c.services.filter((s) => s.name.toLowerCase().includes(q)) }))
      .filter((c) => c.services.length > 0);
  }, [def, query]);

  return (
    <aside
      className={cn(
        "relative flex shrink-0 flex-col overflow-hidden border-r border-border bg-surface transition-[width] duration-300 ease-out",
        collapsed ? "w-9" : "w-[248px]",
      )}
    >
      <button
        onClick={onToggle}
        aria-label="Expand component library"
        className={cn(
          "absolute inset-0 z-10 flex flex-col items-center gap-3 bg-surface py-3 text-muted-foreground transition-opacity duration-200 hover:text-foreground",
          collapsed ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ChevronRight className="size-4" />
        <span className="text-[11px] font-medium [writing-mode:vertical-rl]">Components</span>
      </button>

      <div
        className={cn(
          "flex h-full w-[248px] min-w-[248px] flex-col transition-opacity duration-200",
          collapsed ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <span className="text-[13px] font-semibold">Component Library</span>
        <button
          onClick={onToggle}
          aria-label="Collapse component library"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>

      <div className="border-b border-border p-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${def.short} services...`}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-4">
        <Section title="Boundaries" icon>
          <div className="grid gap-1">
            {BOUNDARY_KINDS.map((b) => (
              <button
                key={b.id}
                type="button"
                title={`Click to add ${b.label}`}
                onClick={() => onAdd({ kind: "boundary", id: b.id, label: b.label })}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    "application/archguard",
                    JSON.stringify({ kind: "boundary", id: b.id, label: b.label }),
                  );
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="flex w-full cursor-grab items-center gap-2 rounded-md border border-dashed border-border px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground active:cursor-grabbing"
              >
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: b.color }} />
                {b.label}
              </button>
            ))}
          </div>
        </Section>

        {categories.map((cat) => (
          <Section key={cat.name} title={cat.name}>
            <div className="grid gap-1">
              {cat.services.map((svc) => (
                <ServiceCard key={svc.id} svc={svc} cloud={cloud} onAdd={onAdd} />
              ))}
            </div>
          </Section>
        ))}

        {categories.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">No services match.</p>
        ) : null}
      </div>
      </div>
    </aside>
  );
}

function Section({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: boolean;
}) {
  return (
    <div className="pt-3">
      <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon ? <Layers className="size-3" /> : null}
        {title}
      </div>
      {children}
    </div>
  );
}

function ServiceCard({
  svc,
  cloud,
  onAdd,
}: {
  svc: ServiceDef;
  cloud: CloudId;
  onAdd: (payload: LibraryPayload) => void;
}) {
  const Icon = svc.icon;
  const color = cloud === "aws" ? "var(--aws)" : cloud === "azure" ? "var(--azure)" : "var(--gcp)";
  return (
    <button
      type="button"
      title={`Click to add ${svc.name}`}
      onClick={() => onAdd({ kind: "service", id: svc.id, label: svc.name })}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "application/archguard",
          JSON.stringify({ kind: "service", id: svc.id, label: svc.name }),
        );
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "flex w-full cursor-grab items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-left text-xs transition-colors hover:border-primary/60 active:cursor-grabbing",
      )}
    >
      <span
        className="flex size-5 items-center justify-center rounded"
        style={{ backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)`, color }}
      >
        <Icon className="size-3" />
      </span>
      <span className="truncate">{svc.name}</span>
    </button>
  );
}