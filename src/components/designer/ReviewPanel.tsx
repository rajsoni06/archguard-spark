import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  ChevronRight,
  CircleCheck,
  PanelRightClose,
  Sparkles,
} from "lucide-react";
import { ScoreRing } from "./ScoreRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { explainAnalysis, type AnalysisResult, type ProjectContext } from "@/lib/ruleEngine";

interface Props {
  result: AnalysisResult | null;
  ctx: ProjectContext;
  collapsed: boolean;
  onToggle: () => void;
  onRun: () => void;
}

export function ReviewPanel({ result, ctx, collapsed, onToggle, onRun }: Props) {
  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        aria-label="Expand review panel"
        className="flex w-9 shrink-0 flex-col items-center gap-3 border-l border-border bg-surface py-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight className="size-4 rotate-180" />
        <span className="text-[11px] font-medium [writing-mode:vertical-rl]">Review</span>
      </button>
    );
  }

  return (
    <aside className="flex w-[330px] shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="text-[13px] font-semibold">Architecture Review</span>
        <button
          onClick={onToggle}
          aria-label="Collapse review panel"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <PanelRightClose className="size-4" />
        </button>
      </div>

      {!result ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Design your architecture, then run the deterministic rule engine to get category scores,
            strengths and violations.
          </p>
          <Button size="sm" onClick={onRun}>
            Review Architecture
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="analysis" className="flex min-h-0 flex-1 flex-col gap-0">
          <TabsList className="m-2.5 grid grid-cols-4">
            <TabsTrigger value="analysis" className="text-[11px]">Analysis</TabsTrigger>
            <TabsTrigger value="score" className="text-[11px]">Score</TabsTrigger>
            <TabsTrigger value="suggestions" className="text-[11px]">Fixes</TabsTrigger>
            <TabsTrigger value="ai" className="text-[11px]">Assistant</TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            <TabsContent value="analysis" className="mt-0 space-y-4">
              <Group title={`Detected strengths (${result.strengths.length})`}>
                {result.strengths.map((r) => (
                  <li key={r.rule.id} className="flex gap-2 text-xs text-muted-foreground">
                    <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
                    <span>{r.rule.strength}</span>
                  </li>
                ))}
                {result.strengths.length === 0 ? <Empty text="No rules satisfied yet." /> : null}
              </Group>

              <Group title={`Issues (${result.issues.length})`}>
                {result.issues.map((r) => (
                  <li key={r.rule.id} className="rounded-lg border border-border bg-card p-2.5">
                    <div className="flex gap-2">
                      <AlertTriangle
                        className={`mt-0.5 size-3.5 shrink-0 ${
                          r.rule.severity === "critical" ? "text-destructive" : "text-warning"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium">{r.rule.issue}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Badge variant="outline" className="h-4 border-border px-1 text-[9px] uppercase">
                            {r.rule.category}
                          </Badge>
                          <Badge variant="outline" className="h-4 border-border px-1 text-[9px] uppercase">
                            {r.rule.severity}
                          </Badge>
                        </div>
                        {r.rule.learn ? (
                          <Link
                            to="/knowledge"
                            search={{ article: r.rule.learn }}
                            className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                          >
                            <BookOpen className="size-3" /> Learn: {r.rule.learn.replace(/-/g, " ")}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
                {result.issues.length === 0 ? <Empty text="No violations detected." /> : null}
              </Group>
            </TabsContent>

            <TabsContent value="score" className="mt-0">
              <div className="flex flex-col items-center py-3">
                <ScoreRing value={result.overall} />
                <Badge className="mt-3" variant="outline">
                  {result.maturity}
                </Badge>
              </div>
              <div className="mt-3 space-y-2.5">
                {result.categories.map((c) => (
                  <div key={c.category}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{c.category}</span>
                      <span className="font-medium">{c.score}/100</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${c.score}%`,
                          backgroundColor:
                            c.score >= 85 ? "var(--success)" : c.score >= 60 ? "var(--primary)" : "var(--warning)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="suggestions" className="mt-0 space-y-2">
              {result.issues.map((r, i) => (
                <div key={r.rule.id} className="rounded-lg border border-border bg-card p-2.5">
                  <div className="text-[11px] font-semibold text-primary">Recommendation {i + 1}</div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {r.rule.recommendation}
                  </p>
                </div>
              ))}
              {result.issues.length === 0 ? <Empty text="Nothing to improve for this context." /> : null}
            </TabsContent>

            <TabsContent value="ai" className="mt-0 space-y-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                  <Bot className="size-3.5" /> AI explanation
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {explainAnalysis(result, ctx)}
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-border p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Sparkles className="size-3.5" /> Rule Engine decides · AI explains
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  Every sentence above is derived from the {result.strengths.length + result.issues.length}{" "}
                  deterministic rules evaluated for {ctx.pattern} · {ctx.scale} · {ctx.industry}.
                </p>
              </div>
            </TabsContent>
          </div>

          <div className="border-t border-border p-2.5">
            <Button size="sm" className="w-full" onClick={onRun}>
              Re-run review
            </Button>
          </div>
        </Tabs>
      )}
    </aside>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <li className="text-xs text-muted-foreground">{text}</li>;
}