import type { PageMeta } from "@/lib/pageMeta";
import { Badge } from "@/components/ui/badge";

export function PlaceholderPanel({ meta }: { meta: PageMeta }) {
  return (
    <div className="mx-auto grid max-w-4xl gap-3">
      {meta.items.map((item) => (
        <div
          key={item.title}
          className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/40"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{item.title}</div>
            <div className="truncate text-xs text-muted-foreground">{item.detail}</div>
          </div>
          {item.badge ? (
            <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">
              {item.badge}
            </Badge>
          ) : null}
        </div>
      ))}
    </div>
  );
}