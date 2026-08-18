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
import { explainAnalysis, type AnalysisResult, type ProjectContext } from "@/lib/ruleEngine";
import { cn } from "@/lib/utils";

interface Props {
  result: AnalysisResult | null;
  ctx: ProjectContext;
  cost: CostEstimate;
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
  collapsed,
  width,
  onResize,
  nodeCount,
  onFocusLibrary,
  onToggle,
  onRun,
}: Props) {
  const asideRef = useRef<HTMLElement>(null);
  const [dragging, setDragging] = useState(false);
  const isEmpty = nodeCount === 0;

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
      style={{ width: collapsed ? 36 : width }}
      className={cn(
        "relative flex shrink-0 flex-col overflow-hidden border-l border-border bg-surface",
        dragging ? "transition-none" : "transition-[width] duration-300 ease-out",
      )}
    >
      {!collapsed ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize review panel"
          onMouseDown={startResize}
          onDoubleClick={() => onResize(360)}
          className="group absolute inset-y-0 left-0 z-20 flex w-2 cursor-col-resize items-center justify-center hover:bg-primary/10"
        >
          <GripVertical className="size-3 text-muted-foreground/60 transition-colors group-hover:text-primary" />
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
        style={{ width: collapsed ? 330 : width, minWidth: collapsed ? 330 : width }}
        className={cn(
          "flex h-full flex-col transition-opacity duration-200",
          collapsed ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
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
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-sm font-semibold">Review your architecture</div>
              <p className="mt-2 text-[13px] leading-relaxed text-foreground/75">
                Design your architecture, then run the deterministic rule engine to get category
                scores, strengths and violations.
              </p>
              <Button className="mt-4 h-11 w-full text-sm" onClick={onRun}>
                <Sparkles className="size-4" /> Review Architecture
              </Button>
            </div>
            <CostCard cost={cost} ctx={ctx} />
          </div>
        ) : (
          <Tabs defaultValue="analysis" className="flex min-h-0 flex-1 flex-col gap-0">
            <TabsList className="m-2.5 grid grid-cols-5">
              <TabsTrigger value="analysis" className="text-[11px]">Analysis</TabsTrigger>
              <TabsTrigger value="score" className="text-[11px]">Score</TabsTrigger>
              <TabsTrigger value="cost" className="text-[11px]">Cost</TabsTrigger>
              <TabsTrigger value="suggestions" className="text-[11px]">Fixes</TabsTrigger>
              <TabsTrigger value="ai" className="text-[11px]">AI</TabsTrigger>
            </TabsList>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
              <TabsContent value="analysis" className="mt-0 space-y-4">
                {isEmpty ? (
                  <EmptyArchitecture onFocusLibrary={onFocusLibrary} />
                ) : (
                  <>
                <Group title={`Detected strengths (${result.strengths.length})`}>
                  {result.strengths.map((r) => (
                    <li key={r.rule.id} className="flex gap-2 text-[13px] leading-relaxed text-foreground/80">
                      <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
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
                          <div className="text-[13px] font-medium leading-snug">{r.rule.issue}</div>
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

                <CostCard cost={cost} ctx={ctx} />
                  </>
                )}
              </TabsContent>

              <TabsContent value="score" className="mt-0">
                {isEmpty ? <EmptyArchitecture onFocusLibrary={onFocusLibrary} /> : null}
                <div className="flex flex-col items-center py-3">
                  <ScoreRing value={result.overall} />
                  <div className="mt-2 text-xs font-medium uppercase tracking-wider text-foreground/70">
                    Overall Architecture Score
                  </div>
                  <Badge className="mt-2" variant="outline">
                    {result.maturity}
                  </Badge>
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
                          className="h-full rounded-full transition-all duration-500"
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

              <TabsContent value="cost" className="mt-0 space-y-3">
                <CostCard cost={cost} ctx={ctx} defaultOpen />
              </TabsContent>

              <TabsContent value="suggestions" className="mt-0 space-y-2">
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

              <TabsContent value="ai" className="mt-0 space-y-3">
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                    <Bot className="size-3.5" /> AI explanation
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-foreground/80">
                    {explainAnalysis(result, ctx)}
                  </p>
                </div>
                <div className="rounded-lg border border-dashed border-border p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Sparkles className="size-3.5" /> Rule Engine decides · AI explains
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                    Every sentence above is derived from the{" "}
                    {result.strengths.length + result.issues.length} deterministic rules evaluated for{" "}
                    {ctx.pattern} · {ctx.scale} · {ctx.industry}.
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
        <div className="mt-1 text-2xl font-semibold tabular-nums">$0 / month</div>
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
        <span className="text-[28px] font-semibold leading-none tabular-nums transition-all">
          {formatUsd(cost.total)}
        </span>
        <span className="text-xs text-foreground/70">/ month</span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-success">
        ↓ {cost.deltaPercent}%
        <span className="text-foreground/70">vs an unoptimized {ctx.cloud.toUpperCase()} baseline</span>
      </div>

      <button
        onClick={() => setShowBreakdown((v) => !v)}
        className="mt-2.5 flex w-full items-center justify-between rounded-md border border-border px-2 py-2 text-xs font-medium transition-colors hover:bg-accent"
      >
        View Cost Breakdown
        <ChevronDown className={cn("size-3.5 transition-transform", showBreakdown && "rotate-180")} />
      </button>

      {showBreakdown ? (
        <div className="mt-2 space-y-1 border-t border-border pt-2">
          {cost.lines.map((l) => (
            <div key={l.label} className="flex items-center justify-between py-0.5 text-xs">
              <span className="truncate font-medium text-foreground/85">{l.label}</span>
              <span className="font-medium tabular-nums text-foreground">{formatUsd(l.amount)}</span>
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
        <ChevronDown className={cn("size-3.5 transition-transform", showAssumptions && "rotate-180")} />
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
