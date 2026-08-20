import { GitBranch, Lightbulb, ThumbsDown, ThumbsUp, X } from "lucide-react";
import type { ServiceDef } from "@/lib/catalog";
import { getServiceDecisionMetadata } from "@/lib/serviceMetadata";

interface Props {
  svc: ServiceDef;
  onClose: () => void;
}

export function TradeoffCard({ svc, onClose }: Props) {
  const info = getServiceDecisionMetadata(svc);
  const Icon = svc.icon;

  return (
    <div className="absolute right-2 top-14 z-40 w-80 rounded-2xl border border-border bg-background shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary"><Icon className="size-4" /></span>
          <div><div className="text-sm font-semibold">{svc.name}</div><div className="text-[10px] text-muted-foreground">{svc.category} · Decision Card</div></div>
        </div>
        <button onClick={onClose} aria-label="Close decision card" className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><X className="size-3.5" /></button>
      </div>

      <div className="max-h-[70vh] space-y-3.5 overflow-y-auto p-4">
        <p className="text-[11px] leading-relaxed text-muted-foreground">{info.description}</p>
        <section><Heading icon={<Lightbulb className="size-3" />} text="Why use it?" /><p className="text-[12px] leading-relaxed text-foreground">{info.whyUse}</p></section>
        <DecisionList title="Good for" icon={<ThumbsUp className="size-3" />} items={info.goodFor} tone="success" />
        <DecisionList title="Not ideal for" icon={<ThumbsDown className="size-3" />} items={info.notIdealFor} />
        <section><Heading icon={<GitBranch className="size-3" />} text="Alternatives" /><div className="flex flex-wrap gap-1.5">{info.alternatives.map((item) => <span key={item} className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">{item}</span>)}</div></section>
        <DecisionList title="⚖ Trade-offs" items={info.tradeOffs} />
      </div>
    </div>
  );
}

function Heading({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{icon}{text}</div>;
}

function DecisionList({ title, icon, items, tone }: { title: string; icon?: React.ReactNode; items: string[]; tone?: "success" }) {
  return <section><Heading icon={icon} text={title} /><ul className="space-y-1">{items.map((item) => <li key={item} className="flex items-start gap-1.5 text-[11px] text-foreground"><span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${tone === "success" ? "bg-success" : "bg-muted-foreground/50"}`} />{item}</li>)}</ul></section>;
}
