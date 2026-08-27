type RingProps = {
  value: number;
  max: number;
  color: string;
  size?: number;
  stroke?: number;
  label: string;
  sub?: string;
};

export function ProgressRing({ value, max, color, size = 104, stroke = 9, label, sub }: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max <= 0 ? 0 : Math.min(value / max, 1);
  return (
    <div className="flex w-[120px] flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#1b2430" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c * pct} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-mono text-sm text-snow">{Math.round(value)}</span>
        </div>
      </div>
      <div className="text-center text-[11px] uppercase tracking-wide text-fog">{label}</div>
      {sub ? <div className="text-center text-[11px] text-fog">{sub}</div> : null}
    </div>
  );
}

export function MacroBar({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const pct = goal <= 0 ? 0 : Math.min((value / goal) * 100, 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono text-fog">
          {Math.round(value)} / {goal}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-card-2">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
