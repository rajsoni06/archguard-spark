import { useEffect, useState } from "react";

export function ScoreRing({
  value,
  size = 132,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const [displayValue, setDisplayValue] = useState(Math.min(10, value));
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color =
    value >= 85 ? "var(--success)" : value >= 65 ? "var(--primary)" : value >= 45 ? "var(--warning)" : "var(--destructive)";

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }

    const from = Math.min(10, value);
    const start = performance.now();
    const duration = 750;
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="relative" aria-label={`Architecture score ${displayValue} out of 100`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * displayValue) / 100}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tracking-tight" style={{ color }}>
          {displayValue}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label ?? "/ 100"}
        </span>
      </div>
    </div>
  );
}
