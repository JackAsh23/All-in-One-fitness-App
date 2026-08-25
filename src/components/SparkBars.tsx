import type { WeekBucket } from "../lib/analytics";

type Props = {
  data: WeekBucket[];
  unit?: string;
  color?: string;
  formatValue?: (value: number) => string;
};

export function SparkBars({ data, unit = "", color = "#3ee07f", formatValue }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((item) => {
        const pct = (item.value / max) * 100;
        return (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-1">
            <span className="font-mono text-[9px] text-fog">
              {formatValue ? formatValue(item.value) : item.value}
              {unit && item.value > 0 ? unit : ""}
            </span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md min-h-[4px]"
                style={{ height: `${Math.max(pct, item.value > 0 ? 8 : 2)}%`, background: color }}
                title={`${item.label}: ${item.value}${unit}`}
              />
            </div>
            <span className="text-[8px] text-fog truncate w-full text-center">{item.label.split(" ")[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

type LineProps = {
  points: { label: string; value: number }[];
  color?: string;
  invertBetter?: boolean;
  formatValue?: (value: number) => string;
};

export function SparkLine({ points, color = "#ff6b4a", invertBetter = false, formatValue }: LineProps) {
  if (points.length === 0) {
    return <p className="text-sm text-fog">Not enough data yet.</p>;
  }
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 280;
  const h = 72;
  const coords = points.map((p, i) => {
    const x = (i / Math.max(points.length - 1, 1)) * w;
    const y = h - ((p.value - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  });
  const last = points[points.length - 1];
  const first = points[0];
  const improved = invertBetter ? last.value < first.value : last.value > first.value;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
        <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" points={coords.join(" ")} />
        {coords.map((c, i) => {
          const [x, y] = c.split(",").map(Number);
          return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
        })}
      </svg>
      <div className="flex justify-between text-xs text-fog">
        <span>{points[0]?.label}</span>
        <span className={improved ? "text-life" : ""}>
          {formatValue ? formatValue(last.value) : last.value}
          {improved ? " ↑" : ""}
        </span>
      </div>
    </div>
  );
}
