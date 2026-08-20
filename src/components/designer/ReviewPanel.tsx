import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  GripVertical,
  LayoutDashboard,
  PanelRightClose,
  PiggyBank,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScoreRing } from "./ScoreRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatUsd, type CostEstimate } from "@/lib/costEngine";
import { explainAnalysis, getArchitectureRoadmap, type AnalysisResult, type ProjectContext } from "@/lib/ruleEngine";
import { cn } from "@/lib/utils";

interface Props {
  result: AnalysisResult | null;
  ctx: ProjectContext;
  cost: CostEstimate;
  open: boolean;
  collapsed: boolean;
  width: number;
  onResize: (width: number) => void;
  nodeCount: number;
  onFocusLibrary: () => void;
  onToggle: () => void;
  onRun: () => void;
}

export function ReviewPanel({
  result,
  ctx,
  cost,
  open,
  collapsed,
  width,
  onResize,
  nodeCount,
  onFocusLibrary,
  onToggle,
  onRun,
}: Props) {
  const asideRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<string>("analysis");
  const tabScroll = useRef<Record<string, number>>({});
  const [dragging, setDragging] = useState(false);
  const isEmpty = nodeCount === 0;
  const tabIndex = ["analysis", "score", "cost", "suggestions", "ai"].indexOf(activeTab);

  const startResize = useCallback(() => setDragging(true), []);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      const right = asideRef.current?.getBoundingClientRect().right ?? window.innerWidth;
      onResize(right - e.clientX);
    };
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragging, onResize]);

  return (
    <aside
      ref={asideRef}
      aria-hidden={!open}
      style={{ width: open ? (collapsed ? 36 : width) : 0 }}
      className={cn(
        "relative flex shrink-0 flex-col overflow-hidden border-l border-border bg-surface",
        dragging ? "transition-none" : "transition-[width] duration-300 ease-in-out",
        "motion-reduce:transition-none",
      )}
    >
      {!collapsed ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize review panel"
          onMouseDown={startResize}
          onDoubleClick={() => onResize(340)}
          className="group absolute inset-y-0 left-0 z-50 flex w-[4px] cursor-col-resize items-center justify-center hover:bg-neutral-200/60 dark:hover:bg-neutral-700/40"
        >
          <GripVertical className="size-2 text-neutral-400 transition-colors group-hover:text-neutral-500 group-active:text-neutral-600" />
        </div>
      ) : null}

      <button
        onClick={onToggle}
        aria-label="Expand review panel"
        className={cn(
          "absolute inset-0 z-10 flex flex-col items-center gap-3 bg-surface py-3 text-muted-foreground transition-opacity duration-200 hover:text-foreground",
          collapsed ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ChevronRight className="size-4 rotate-180" />
        <span className="text-[11px] font-medium [writing-mode:vertical-rl]">Review</span>
      </button>

      <div
        style={{ width: collapsed ? 290 : width, minWidth: collapsed ? 290 : width }}
        className={cn(
          "flex h-full flex-col overflow-hidden transition-[transform,opacity] duration-300 ease-out",
          open && !collapsed ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-3 opacity-0",
          "motion-reduce:transform-none motion-reduce:transition-none",
        )}
      >
        <div className="flex items-center justify-between border-b border-border pl-3 pr-3 py-2.5">
          <span className="text-sm font-semibold">Architecture Review</span>
          <button
            onClick={onToggle}
            aria-label="Collapse review panel"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PanelRightClose className="size-4" />
          </button>
        </div>

        {!result ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-[13px] font-semibold">Review your architecture</div>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground/75">
                Design your architecture, then run the deterministic rule engine to get category
                scores, strengths and violations.
              </p>
              <Button className="mt-3 h-8 w-full gap-1.5 text-xs" onClick={onRun}>
                <Sparkles className="size-3.5" /> Review Architecture
              </Button>
            </div>
            <CostCard cost={cost} ctx={ctx} />
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              // save current scroll position for the previous tab
              if (scrollContainerRef.current) {
                tabScroll.current[activeTab] = scrollContainerRef.current.scrollTop;
              }
              setActiveTab(v);
              // restore saved position (or scroll to top) for the new tab
              setTimeout(() => {
                if (!scrollContainerRef.current) return;
                const pos = tabScroll.current[v] ?? 0;
                scrollContainerRef.current.scrollTop = pos;
              }, 0);
            }}
            className="flex min-h-0 flex-1 flex-col gap-0"
          >
            <TabsList className="relative m-2.5 grid grid-cols-5">
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-1 rounded-md bg-background shadow transition-[left,width] duration-200 ease-out motion-reduce:transition-none" style={{ left: `calc(${Math.max(tabIndex, 0) * 20}% + 0.25rem)`, width: "calc(20% - 0.5rem)" }} />
              <TabsTrigger value="analysis" className="relative z-10 text-[11px] data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Analysis
              </TabsTrigger>
              <TabsTrigger value="score" className="relative z-10 text-[11px] data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Score
              </TabsTrigger>
              <TabsTrigger value="cost" className="relative z-10 text-[11px] data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Cost
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="relative z-10 text-[11px] data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Fixes
              </TabsTrigger>
              <TabsTrigger value="ai" className="relative z-10 text-[11px] data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                AI
              </TabsTrigger>
            </TabsList>

            <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
              <TabsContent value="analysis" className="tab-panel-content mt-0 space-y-4">
                {isEmpty ? (
                  <EmptyArchitecture onFocusLibrary={onFocusLibrary} />
                ) : (
                  <>
                    <Group title={`Detected strengths (${result.strengths.length})`}>
                      {result.strengths.map((r) => (
                        <li
                          key={r.rule.id}
                          className="flex gap-2 text-[13px] leading-relaxed text-foreground/80"
                        >
                          <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
                          <span>{r.rule.strength}</span>
                        </li>
                      ))}
                      {result.strengths.length === 0 ? (
                        <Empty text="No rules satisfied yet." />
                      ) : null}
                    </Group>

                    <Group title={`Issues (${result.issues.length})`}>
                      {result.issues.map((r) => (
                        <li
                          key={r.rule.id}
                          className="rounded-lg border border-border bg-card p-2.5"
                        >
                          <div className="flex gap-2">
                            <AlertTriangle
                              className={`mt-0.5 size-3.5 shrink-0 ${r.rule.severity === "critical" ? "text-destructive" : "text-warning"
                                }`}
                            />
                            <div className="min-w-0">
                              <div className="text-[13px] font-medium leading-snug">
                                {r.rule.issue}
                              </div>
                              <div className="mt-1 flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className="h-4 border-border px-1 text-[9px] uppercase"
                                >
                                  {r.rule.category}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="h-4 border-border px-1 text-[9px] uppercase"
                                >
                                  {r.rule.severity}
                                </Badge>
                              </div>
                              {r.rule.learn ? (
                                <Link
                                  to="/knowledge"
                                  search={{ article: r.rule.learn }}
                                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                                >
                                  <BookOpen className="size-3" /> Learn:{" "}
                                  {r.rule.learn.replace(/-/g, " ")}
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      ))}
                      {result.issues.length === 0 ? <Empty text="No violations detected." /> : null}
                    </Group>

                    <CostCard cost={cost} ctx={ctx} />
                  </>
                )}
              </TabsContent>

              <TabsContent value="score" className="tab-panel-content mt-0">
                {isEmpty ? <EmptyArchitecture onFocusLibrary={onFocusLibrary} /> : null}
                <div className="flex flex-col items-center py-3">
                  {isEmpty ? (
                    <div className="text-4xl font-semibold text-foreground/40">—</div>
                  ) : (
                    <ScoreRing value={result.overall} />
                  )}
                  <div className="mt-2 text-xs font-medium uppercase tracking-wider text-foreground/70">
                    Overall Architecture Score
                  </div>
                  {isEmpty ? null : (
                    <Badge className="mt-2" variant="outline">
                      {result.maturity}
                    </Badge>
                  )}
                </div>
                <div className="mt-3 space-y-2.5">
                  {result.categories.map((c) => (
                    <div key={c.category}>
                      <div className="mb-1 flex items-center justify-between text-[13px]">
                        <span className="font-medium text-foreground/85">{c.category}</span>
                        <span className="font-semibold tabular-nums">
                          {c.score === null ? "N/A" : `${c.score}/100`}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="score-bar-fill h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${c.score ?? 0}%`,
                            backgroundColor:
                              (c.score ?? 0) >= 85
                                ? "var(--success)"
                                : (c.score ?? 0) >= 60
                                  ? "var(--primary)"
                                  : "var(--warning)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {result.nodeCount === 0 ? (
                  <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                    Insufficient architecture information to evaluate these categories. Add
                    components to the canvas and re-run the review.
                  </p>
                ) : null}
                <div className="mt-4">
                  <CostCard cost={cost} ctx={ctx} />
                </div>
              </TabsContent>

              <TabsContent value="cost" className="tab-panel-content mt-0 space-y-3">
                <CostCard cost={cost} ctx={ctx} defaultOpen />
              </TabsContent>

              <TabsContent value="suggestions" className="tab-panel-content mt-0 space-y-2">
                {isEmpty ? <EmptyArchitecture onFocusLibrary={onFocusLibrary} /> : null}
                {result.issues.map((r, i) => (
                  <div key={r.rule.id} className="rounded-lg border border-border bg-card p-2.5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Recommendation {i + 1}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-foreground/80">
                      {r.rule.recommendation}
                    </p>
                  </div>
                ))}
                {!isEmpty && result.issues.length === 0 ? (
                  <Empty text="Nothing to improve for this context." />
                ) : null}
              </TabsContent>

              <TabsContent value="ai" className="tab-panel-content mt-0 space-y-3">
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                    <Bot className="size-3.5" /> AI explanation
                  </div>
                  <div className="mt-2 space-y-3 text-[13px] leading-relaxed text-foreground/80">
                    {explainAnalysis(result, ctx).split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                    <Sparkles className="size-3.5" /> Architecture roadmap
                  </div>
                  <ol className="mt-2 space-y-2.5">
                    {getArchitectureRoadmap(result, ctx).map((step, index) => (
                      <li key={step} className="flex items-start gap-2 text-[12px] leading-relaxed text-foreground/80">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[10px] font-semibold text-primary">{index + 1}</span>
                        <span><span className="font-semibold text-foreground">Step {index + 1}.</span> {step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="rounded-lg border border-dashed border-border p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Sparkles className="size-3.5" /> Canvas snapshot
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                    I used the services, connections, workload targets, and review findings from
                    this canvas to form the recommendation above.
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
      </div>
    </aside>
  );
}

function CostCard({
  cost,
  ctx,
  defaultOpen = false,
}: {
  cost: CostEstimate;
  ctx: ProjectContext;
  defaultOpen?: boolean;
}) {
  const [showBreakdown, setShowBreakdown] = useState(defaultOpen);
  const [showAssumptions, setShowAssumptions] = useState(false);

  if (!cost.available) {
    return (
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
          Estimated Monthly Cost
        </div>
        <div className="mt-1 text-[21px] font-semibold tabular-nums">$0 / month</div>
        <p className="mt-1 text-xs leading-relaxed text-foreground/70">
          Add cloud services to calculate your estimated infrastructure cost.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
        Estimated Monthly Cost
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[21px] font-semibold leading-none tabular-nums transition-all">
          {formatUsd(cost.total)}
        </span>
        <span className="text-xs text-foreground/70">/ month</span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-success">
        ↓ {cost.deltaPercent}%
        <span className="text-foreground/70">
          vs an unoptimized {ctx.cloud.toUpperCase()} baseline
        </span>
      </div>

      <button
        onClick={() => setShowBreakdown((v) => !v)}
        className="mt-2.5 flex w-full items-center justify-between rounded-md border border-border px-2 py-2 text-xs font-medium transition-colors hover:bg-accent"
      >
        View Cost Breakdown
        <ChevronDown
          className={cn("size-3.5 transition-transform", showBreakdown && "rotate-180")}
        />
      </button>

      {showBreakdown ? (
        <div className="mt-2 space-y-1 border-t border-border pt-2">
          {cost.lines.map((l) => (
            <div key={l.label} className="flex items-center justify-between py-0.5 text-xs">
              <span className="truncate font-medium text-foreground/85">{l.label}</span>
              <span className="font-medium tabular-nums text-foreground">
                {formatUsd(l.amount)}
              </span>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between border-t border-border pt-1.5 text-xs font-semibold">
            <span>Estimated Total</span>
            <span className="tabular-nums">{formatUsd(cost.total)}</span>
          </div>
        </div>
      ) : null}

      <button
        onClick={() => setShowAssumptions((v) => !v)}
        className="mt-2 flex w-full items-center justify-between rounded-md border border-border px-2 py-2 text-xs font-medium transition-colors hover:bg-accent"
      >
        View Assumptions
        <ChevronDown
          className={cn("size-3.5 transition-transform", showAssumptions && "rotate-180")}
        />
      </button>
      {showAssumptions ? (
        <div className="mt-2 space-y-1 border-t border-border pt-2">
          {cost.assumptions.map((a) => (
            <div key={a.label} className="flex items-center justify-between py-0.5 text-xs">
              <span className="font-medium text-foreground/85">{a.label}</span>
              <span className="font-medium text-foreground">{a.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      {cost.recommendations.length ? (
        <div className="mt-3 space-y-2 border-t border-border pt-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
            <PiggyBank className="size-3.5" /> Cost Optimization
          </div>
          {cost.recommendations.map((r) => (
            <div key={r.title} className="rounded-lg border border-border p-2">
              <div className="flex gap-1.5 text-xs font-semibold">
                <AlertTriangle className="mt-0.5 size-3 shrink-0 text-warning" />
                {r.title}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-foreground/75">{r.detail}</p>
              <div className="mt-1 text-xs font-medium text-success">
                Potential savings ~{formatUsd(r.savings)}/month
              </div>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface-2 p-3 text-center">
            <div>
              <div className="text-[13px] font-semibold text-foreground">Current</div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums text-foreground/80">
                {formatUsd(cost.total)}
              </div>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-foreground">Optimized</div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums text-foreground/80">
                {formatUsd(cost.optimized)}
              </div>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-foreground">Savings</div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums text-success">
                {formatUsd(cost.savings)}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <p className="mt-2 text-[11px] leading-relaxed text-foreground/60">
        Estimate only — real bills vary with region, usage, discounts, committed capacity, data
        transfer and taxes.
      </p>
    </div>
  );
}

function EmptyArchitecture({ onFocusLibrary }: { onFocusLibrary: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/25">
        <LayoutDashboard className="size-5" />
      </div>
      <div className="mt-3 text-sm font-semibold">No Architecture to Analyze</div>
      <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-foreground/70">
        Your canvas is empty. Add components to start the security, scalability and performance
        analysis.
      </p>
      <Button size="sm" className="mt-4" onClick={onFocusLibrary}>
        Start Designing
      </Button>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
        {title}
      </div>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <li className="text-[13px] text-foreground/65">{text}</li>;
}
