import { useState } from "react";
import { Check, Cloud, ShieldCheck } from "lucide-react";
import {
  ARCHITECTURE_PATTERNS,
  CLOUDS,
  INDUSTRIES,
  PRIORITIES,
  SCALES,
  type CloudId,
} from "@/lib/catalog";
import type { ProjectContext } from "@/lib/ruleEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CLOUD_ORDER: CloudId[] = ["aws", "azure", "gcp"];

export function SetupScreen({
  initial,
  onStart,
  onCancel,
}: {
  initial?: ProjectContext;
  onStart: (ctx: ProjectContext) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "E-Commerce Platform Architecture");
  const [cloud, setCloud] = useState<CloudId | null>(initial?.cloud ?? null);
  const [pattern, setPattern] = useState(initial?.pattern ?? "Microservices");
  const [scale, setScale] = useState(initial?.scale ?? "1M+ Users");
  const [industry, setIndustry] = useState(initial?.industry ?? "E-Commerce");
  const [priority, setPriority] = useState(initial?.priority ?? "Scalability");

  return (
    <div className="hero-glow flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-6 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <ShieldCheck className="size-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            What cloud platform are you designing for?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This one-time setup selects the service catalogue and the rule set used to score your
            architecture. It disappears once you start designing.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {CLOUD_ORDER.map((id) => {
            const def = CLOUDS[id];
            const active = cloud === id;
            return (
              <button
                key={id}
                onClick={() => setCloud(id)}
                className={cn(
                  "group relative rounded-xl border bg-card p-5 text-left transition-all",
                  active
                    ? "border-primary ring-2 ring-primary/25"
                    : "border-border hover:border-primary/50",
                )}
              >
                {active ? (
                  <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                ) : null}
                <span
                  className="flex size-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${def.colorVar} 16%, transparent)`,
                    color: def.colorVar,
                  }}
                >
                  <Cloud className="size-5" />
                </span>
                <div className="mt-3 text-sm font-semibold">{def.short}</div>
                <div className="text-xs text-muted-foreground">{def.name}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Project name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <OptionGroup label="Architecture Pattern" options={ARCHITECTURE_PATTERNS} value={pattern} onChange={setPattern} />
            <OptionGroup label="Expected Users / Traffic" options={SCALES} value={scale} onChange={setScale} />
            <OptionGroup label="Industry" options={INDUSTRIES} value={industry} onChange={setIndustry} />
            <OptionGroup label="Primary Priority" options={PRIORITIES} value={priority} onChange={setPriority} />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          {onCancel ? (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button
            disabled={!cloud}
            onClick={() => cloud && onStart({ name, cloud, pattern, scale, industry, priority })}
          >
            Start Designing
          </Button>
        </div>
      </div>
    </div>
  );
}

function OptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
              value === opt
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}