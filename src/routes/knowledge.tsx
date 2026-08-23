import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  BookOpenText,
  Clock,
  Layers3,
  Search,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  KNOWLEDGE,
  LEARNING_PATH,
  RECOMMENDED_LEARNING_ORDER,
  findArticle,
  type LearningPathGuide,
} from "@/lib/knowledge";
import { cn } from "@/lib/utils";

const TITLE = "Knowledge Hub — System Design & Cloud Architecture | ArchGuard AI";
const DESCRIPTION =
  "Learn scalability, reliability, security, cloud, performance and cost patterns linked directly to your architecture review findings.";

export const Route = createFileRoute("/knowledge")({
  validateSearch: (search: Record<string, unknown>): { article?: string } =>
    typeof search.article === "string" ? { article: search.article } : {},
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
  const [activeCategory, setActiveCategory] = useState(KNOWLEDGE[0]!.id);
  const open = article ? findArticle(article) : undefined;
  const categories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return KNOWLEDGE;
    return KNOWLEDGE.map((category) => ({
      ...category,
      topics: category.topics.filter((topic) => topic.toLowerCase().includes(q)),
      articles: category.articles.filter((item) =>
        `${item.title} ${item.summary}`.toLowerCase().includes(q),
      ),
    })).filter(
      (category) =>
        category.topics.length ||
        category.articles.length ||
        category.name.toLowerCase().includes(q),
    );
  }, [query]);
  const current = categories.find((category) => category.id === activeCategory) ?? categories[0];

  return (
    <AppShell>
      <div className="knowledge-hub-page flex min-h-0 flex-1 flex-col">
      <PageHeader title="Knowledge Hub" subtitle="Design → Review → Learn → Improve">
        <div className="relative ml-auto w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics and articles..."
            aria-label="Search topics and articles"
            className="h-8 w-full rounded-full bg-background pl-9 text-[13px] shadow-sm"
          />
        </div>
      </PageHeader>
      {open ? (
        <ArticleView article={open} onBack={() => navigate({ search: () => ({}) })} />
      ) : (
        <HubView
          categories={categories}
          current={current}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
          onArticle={(slug) => navigate({ search: { article: slug } })}
        />
      )}
      </div>
    </AppShell>
  );
}

function HubView({
  categories,
  current,
  activeCategory,
  onCategory,
  onArticle,
}: {
  categories: typeof KNOWLEDGE;
  current?: (typeof KNOWLEDGE)[number];
  activeCategory: string;
  onCategory: (id: string) => void;
  onArticle: (slug: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      <aside className="shrink-0 border-b border-border bg-card/50 p-3 md:w-56 md:border-b-0 md:border-r md:p-3 lg:w-64 lg:p-4">
        <div className="mb-3 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Layers3 className="size-3.5 text-primary" /> Learning paths
        </div>
        <nav className="flex gap-1 overflow-x-auto md:grid md:gap-1">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategory(category.id)}
              className={cn(
                "group flex min-w-0 shrink-0 items-center justify-between rounded-xl px-2.5 py-2 text-left text-[12px] transition-colors md:w-full lg:px-3 lg:py-2.5 lg:text-[13px]",
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <span className="min-w-0 truncate">{category.name}</span>
              <span
                className={cn(
                  "ml-3 shrink-0 rounded-full px-1.5 py-0.5 text-[10px]",
                  activeCategory === category.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {category.articles.length}
              </span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
        {current ? <CategoryView category={current} onArticle={onArticle} /> : <EmptySearch />}
      </main>
    </div>
  );
}

function CategoryView({
  category,
  onArticle,
}: {
  category: (typeof KNOWLEDGE)[number];
  onArticle: (slug: string) => void;
}) {
  const [featured, ...articles] = category.articles;
  const guide = LEARNING_PATH.find((item) => item.id === category.id);
  return (
    <div className="knowledge-category mx-auto max-w-6xl">
      <section className="knowledge-path-hero relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="size-3.5" /> Knowledge path
          </div>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight sm:text-2xl">
            {category.name}
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground sm:text-[13px]">
            {category.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {category.topics.map((topic) => (
              <Badge
                key={topic}
                variant="outline"
                className="border-border/80 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      </section>
      {guide ? <LearningGuide guide={guide} showOrder={category.id === "patterns"} /> : null}
      {featured ? (
        <button
          type="button"
          onClick={() => onArticle(featured.slug)}
          className="knowledge-featured-card group mt-3 grid w-full gap-3 rounded-2xl border border-border bg-card p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md sm:grid-cols-[1fr_auto] sm:p-4"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              <BookOpenText className="size-4" /> Start here
            </div>
            <h3 className="mt-1.5 text-base font-semibold tracking-tight group-hover:text-primary sm:text-lg">
              {featured.title}
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground sm:text-[13px]">
              {featured.summary}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" /> {featured.readMinutes} min read
            </div>
          </div>
          <div className="flex size-11 items-center justify-center self-start rounded-full bg-primary/10 text-primary transition-transform group-hover:translate-x-1">
            <ArrowUpRight className="size-5" />
          </div>
        </button>
      ) : null}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Continue learning
          </p>
          <h3 className="mt-0.5 text-base font-semibold tracking-tight">
            More patterns and practical guidance
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">{category.articles.length} articles</span>
      </div>
      <div className="knowledge-article-grid mt-2.5 grid gap-2.5 md:grid-cols-2">
        {articles.map((item, index) => (
          <ArticleCard
            key={item.slug}
            article={item}
            index={index}
            onClick={() => onArticle(item.slug)}
          />
        ))}
      </div>
    </div>
  );
}

function LearningGuide({ guide, showOrder }: { guide: LearningPathGuide; showOrder: boolean }) {
  return (
    <section className="knowledge-guide mt-3 grid grid-cols-1 gap-2.5">
      <div className="rounded-2xl border border-border bg-card p-3.5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          Definition
        </div>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{guide.definition}</p>
        {false && showOrder ? (
          <div className="mt-3 border-t border-border pt-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Recommended interview order
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
              {RECOMMENDED_LEARNING_ORDER.join(" → ")}
            </p>
          </div>
        ) : null}
      </div>
      {showOrder ? (
        <div className="rounded-2xl border border-border bg-card p-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Recommended interview order
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
            {RECOMMENDED_LEARNING_ORDER.join(" → ")}
          </p>
        </div>
      ) : null}
      <div className="rounded-2xl border border-border bg-card p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Core contents
          </div>
          <span className="text-[10px] text-muted-foreground">
            {guide.contents.length} concepts
          </span>
        </div>
        <div className="knowledge-contents mt-2 flex max-h-28 flex-wrap content-start gap-1 overflow-y-auto pr-1">
          {guide.contents.map((content) => (
            <span
              key={content}
              className="rounded-md border border-border/80 bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground"
            >
              {content}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArticleCard({
  article,
  index,
  onClick,
}: {
  article: (typeof KNOWLEDGE)[number]["articles"][number];
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-primary">
          <BookOpen className="size-4" />
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">0{index + 2}</span>
      </div>
      <h4 className="mt-3 text-sm font-semibold leading-snug group-hover:text-primary">
        {article.title}
      </h4>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {article.summary}
      </p>
      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" /> {article.readMinutes} min read
        </span>
        <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </button>
  );
}

function ArticleView({
  article,
  onBack,
}: {
  article: NonNullable<ReturnType<typeof findArticle>>;
  onBack: () => void;
}) {
  return (
    <main className="flex-1 overflow-y-auto bg-muted/20 p-3 sm:p-4 lg:p-5">
      <article className="mx-auto max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 -ml-2 text-muted-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" /> Back to Knowledge Hub
        </Button>
        <header className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            <BookOpenText className="size-4" /> Architecture field note
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
            {article.title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-muted-foreground sm:text-sm">
            {article.summary}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Clock className="size-3.5" /> {article.readMinutes} min read{" "}
            <span className="text-border">•</span> Practical guide
          </div>
        </header>
        <div className="mt-4 space-y-3">
          {article.sections.map((section, index) => (
            <section
              key={section.heading}
              className="rounded-xl border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex gap-3">
                <span className="text-xs font-semibold text-primary">0{index + 1}</span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{section.heading}</h3>
                  <div className="mt-2 space-y-2">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="text-[13px] leading-6 text-muted-foreground">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}

function EmptySearch() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="text-center">
        <Search className="mx-auto size-7 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium">No topics or articles found</p>
        <p className="mt-1 text-xs text-muted-foreground">Try a broader search term.</p>
      </div>
    </div>
  );
}
