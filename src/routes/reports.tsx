import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { PlaceholderPanel } from "@/components/PlaceholderPanel";
import { PAGE_META } from "@/lib/pageMeta";

const meta = PAGE_META["reports"]!;

export const Route = createFileRoute("/reports")({
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
      <div className="flex-1 overflow-y-auto p-6">
        <PlaceholderPanel meta={meta} />
      </div>
    </AppShell>
  );
}
