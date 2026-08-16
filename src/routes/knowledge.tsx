import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Clock, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KNOWLEDGE, findArticle } from "@/lib/knowledge";
import { cn } from "@/lib/utils";

const TITLE = "Knowledge Hub — System Design & Cloud Architecture | ArchGuard AI";
const DESCRIPTION =
  "Learn scalability, reliability, security, cloud, performance and cost patterns — linked directly to the findings from your architecture review.";

export const Route = createFileRoute("/knowledge")({
  validateSearch: (search: Record<string, unknown>): { article?: string } =>
    typeof search["article"] === "string" ? { article: search["article"] } : {},
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const { article } = Route.useSearch();
  const navigate = useNavigate({ from: "/knowledge" });
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(KNOWLEDGE[0]!.id);

  const open = article ? findArticle(article) : undefined;

  const categories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return KNOWLEDGE;
    return KNOWLEDGE.map((c) => ({
      ...c,
      topics: c.topics.filter((t) => t.toLowerCase().includes(q)),
      articles: c.articles.filter(
        (art) => art.title.toLowerCase().includes(q) || art.summary.toLowerCase().includes(q),
      ),
    })).filter((c) => c.topics.length > 0 || c.articles.length > 0 || c.name.toLowerCase().includes(q));
  }, [query]);

  const current = categories.find((c) => c.id === activeCategory) ?? categories[0];

  return (
    <AppShell>
      <PageHeader
        title="Knowledge Hub"
        subtitle="Design → Review → Learn → Improve"
        actions={
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics and articles..."
              className="h-9 pl-8 text-xs"
            />
          </div>
        }
      />

      {open ? (
        <div className="flex-1 overflow-y-auto p-6">
          <article className="mx-auto max-w-3xl">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 -ml-2 text-muted-foreground"
              onClick={() => navigate({ search: () => ({}) })}
            >
              <ArrowLeft className="size-4" /> Back to Knowledge Hub
            </Button>
            <h2 className="text-2xl font-semibold tracking-tight">{open.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{open.summary}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" /> {open.readMinutes} min read
            </div>
            <div className="mt-8 space-y-7">
              {open.sections.map((section) => (
                <section key={section.heading}>
                  <h3 className="text-sm font-semibold text-primary">{section.heading}</h3>
                  <div className="mt-2 space-y-2">
                    {section.body.map((p) => (
                      <p key={p} className="text-sm leading-relaxed text-muted-foreground">
                        {p}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <nav className="w-60 shrink-0 space-y-1 overflow-y-auto border-r border-border p-3">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-[13px] transition-colors",
                  current?.id === c.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                {c.name}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-6">
            {current ? (
              <div className="mx-auto max-w-4xl">
                <h2 className="text-lg font-semibold tracking-tight">{current.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{current.description}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {current.topics.map((t) => (
                    <Badge key={t} variant="outline" className="border-border text-muted-foreground">
                      {t}
                    </Badge>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {current.articles.map((art) => (
                    <button
                      key={art.slug}
                      onClick={() => navigate({ search: { article: art.slug } })}
                      className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
                    >
                      <div className="flex items-center gap-2 text-primary">
                        <BookOpen className="size-4" />
                        <span className="text-sm font-medium text-foreground">{art.title}</span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{art.summary}</p>
                      <div className="mt-3 text-[11px] text-muted-foreground">{art.readMinutes} min read</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No topics match that search.</p>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}