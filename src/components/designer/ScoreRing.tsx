export function ScoreRing({
  value,
  size = 132,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color =
    value >= 85 ? "var(--success)" : value >= 65 ? "var(--primary)" : value >= 45 ? "var(--warning)" : "var(--destructive)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
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
          strokeDashoffset={c - (c * value) / 100}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tracking-tight" style={{ color }}>
          {value}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label ?? "/ 100"}
        </span>
      </div>
    </div>
  );
}