import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { PlaceholderPanel } from "@/components/PlaceholderPanel";
import { PAGE_META } from "@/lib/pageMeta";

const meta = PAGE_META["settings"]!;

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: meta.title },
      { name: "description", content: meta.description },
      { property: "og:title", content: meta.title },
      { property: "og:description", content: meta.description },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title={meta.heading} subtitle={meta.subtitle} />
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <Appearance />
        <PlaceholderPanel meta={meta} />
      </div>
    </AppShell>
  );
}

function Appearance() {
  const { theme, setTheme } = useTheme();
  const options = [
    { id: "light" as const, label: "Light Mode", icon: Sun },
    { id: "dark" as const, label: "Dark Mode", icon: Moon },
  ];

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">Appearance</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Choose how ArchGuard AI looks. Your choice is saved on this device.
      </p>
      <div className="mt-4 grid max-w-md gap-3 sm:grid-cols-2">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => setTheme(o.id)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-3 py-3 text-sm transition-colors",
              theme === o.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <o.icon className="size-4" />
            {o.label}
          </button>
        ))}
      </div>
    </section>
  );
}
