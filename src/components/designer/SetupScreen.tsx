import { useState } from "react";
import { Check, Cloud, ShieldCheck, Activity, Gauge, Clock, Wifi } from "lucide-react";
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

const TRAFFIC_OPTIONS = ["1K RPS", "10K RPS", "100K RPS", "1M+ RPS"];
const AVAILABILITY_OPTIONS = ["99%", "99.9%", "99.99%", "99.999%"];
const CONSISTENCY_OPTIONS = ["Strong", "Eventual", "Configurable"];
const LATENCY_OPTIONS = ["<50ms", "<100ms", "<500ms", "<1sec"];

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
  // System Requirements
  const [traffic, setTraffic] = useState(initial?.traffic ?? "10K RPS");
  const [availability, setAvailability] = useState(initial?.availability ?? "99.9%");
  const [consistency, setConsistency] = useState(initial?.consistency ?? "Strong");
  const [latency, setLatency] = useState(initial?.latency ?? "<100ms");

  return (
    <div className="hero-glow flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-6 py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex shrink-0 items-center justify-center">
            <img src="/ArchGuard_Logo.png" alt="ArchGuard Logo" className="h-14 w-auto object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">
              What cloud platform are you designing for?
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              This one-time setup selects the service catalogue and the rule set used to score your
              architecture. It disappears once you start designing.
            </p>
          </div>
        </div>

        <fieldset className="grid gap-3 sm:grid-cols-3 border-none p-0 m-0">
          <legend className="sr-only">Select one cloud platform</legend>
          {CLOUD_ORDER.map((id) => {
            const def = CLOUDS[id];
            const active = cloud === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setCloud(id)}
                className={cn(
                  "group relative flex items-center gap-4 rounded-xl border bg-card p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  active
                    ? "border-primary ring-2 ring-primary/25 shadow-md"
                    : "border-border hover:border-primary/50 hover:shadow-sm",
                )}
              >
                {/* Radio indicator — top right */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute right-3 top-3 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                    active
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40 bg-transparent group-hover:border-primary/60",
                  )}
                >
                  {active && (
                    <span className="size-2 rounded-full bg-primary-foreground" />
                  )}
                </span>

                {id === "aws" ? (
                  <img src="/AWS-Logo.png" alt="AWS Logo" className="h-20 w-20 object-contain shrink-0" />
                ) : id === "azure" ? (
                  <img src="/Azure_Logo.png" alt="Azure Logo" className="h-28 w-28 object-contain shrink-0" />
                ) : id === "gcp" ? (
                  <img src="/Google_Cloud_Logo.png" alt="GCP Logo" className="h-20 w-20 object-contain shrink-0" />
                ) : (
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${def.colorVar} 16%, transparent)`,
                      color: def.colorVar,
                    }}
                  >
                    <Cloud className="size-5" />
                  </span>
                )}
                <div className="min-w-0 pr-2">
                  <div className="text-sm font-semibold">{def.short}</div>
                  <div className="truncate text-xs text-muted-foreground">{def.name}</div>
                </div>
              </button>
            );
          })}
        </fieldset>


        <div className="mt-3 rounded-xl border border-border bg-muted/50 p-4">
          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Project name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <OptionGroup label="Architecture Pattern" options={ARCHITECTURE_PATTERNS} value={pattern} onChange={setPattern} />
            <OptionGroup label="Expected Users / Traffic" options={SCALES} value={scale} onChange={setScale} />
            <OptionGroup label="Industry" options={INDUSTRIES} value={industry} onChange={setIndustry} />
            <OptionGroup label="Primary Priority" options={PRIORITIES} value={priority} onChange={setPriority} />
          </div>
        </div>

        {/* ── System Requirements ── */}
        <div className="mt-3 rounded-xl border border-border bg-muted/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="size-3.5 text-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              System Requirements
            </span>
            <span className="ml-1 text-[10px] text-muted-foreground">— used by the rule engine to detect SPOFs and trade-offs</span>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <OptionGroup
              label="Expected Traffic (RPS)"
              icon={<Wifi className="size-3" />}
              options={TRAFFIC_OPTIONS}
              value={traffic}
              onChange={setTraffic}
            />
            <OptionGroup
              label="Availability Target"
              icon={<ShieldCheck className="size-3" />}
              options={AVAILABILITY_OPTIONS}
              value={availability}
              onChange={setAvailability}
            />
            <OptionGroup
              label="Data Consistency"
              icon={<Gauge className="size-3" />}
              options={CONSISTENCY_OPTIONS}
              value={consistency}
              onChange={setConsistency}
            />
            <OptionGroup
              label="Latency Requirement"
              icon={<Clock className="size-3" />}
              options={LATENCY_OPTIONS}
              value={latency}
              onChange={setLatency}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          {onCancel ? (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button
            disabled={!cloud}
            onClick={() =>
              cloud &&
              onStart({
                name,
                cloud,
                pattern,
                scale,
                industry,
                priority,
                traffic,
                availability,
                consistency,
                latency,
              })
            }
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
  icon,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
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