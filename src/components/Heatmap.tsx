import type { ReactNode } from "react";
import { toISODate } from "../lib/dates";

export type HeatPalette = "life" | "run" | "lift" | "eat";

const PALETTES: Record<HeatPalette, readonly string[]> = {
  life: ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"],
  run: ["bg-run-heat-0", "bg-run-heat-1", "bg-run-heat-2", "bg-run-heat-3", "bg-run-heat-4"],
  lift: ["bg-lift-heat-0", "bg-lift-heat-1", "bg-lift-heat-2", "bg-lift-heat-3", "bg-lift-heat-4"],
  eat: ["bg-eat-heat-0", "bg-eat-heat-1", "bg-eat-heat-2", "bg-eat-heat-3", "bg-eat-heat-4"],
};

type HeatmapProps = {
  weeks: { date: string; level: 0 | 1 | 2 | 3 | 4 }[][];
  selected?: string;
  onSelect?: (date: string) => void;
  palette?: HeatPalette;
};

const WEEKDAYS = ["M", "", "W", "", "F", "", ""];

export function Heatmap({ weeks, selected, onSelect, palette = "life" }: HeatmapProps) {
  const levels = PALETTES[palette];
  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex gap-[3px] min-w-max">
        <div className="flex flex-col gap-[3px] pr-1">
          {WEEKDAYS.map((label, index) => (
            <span key={`${label}-${index}`} className="h-[11px] w-2 text-[8px] leading-[11px] text-fog">
              {label}
            </span>
          ))}
        </div>
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {week.map((cell) => (
              <button
                key={cell.date}
                type="button"
                title={cell.date}
                onClick={() => onSelect?.(cell.date)}
                className={`no-press size-[11px] rounded-[2px] ${levels[cell.level]} ${
                  selected === cell.date ? "ring-1 ring-snow" : ""
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeatLegend({ label, palette = "life" }: { label: string; palette?: HeatPalette }) {
  const levels = PALETTES[palette];
  return (
    <div className="mt-3 flex items-center justify-between text-[11px] text-fog">
      <span>{label}</span>
      <div className="flex items-center gap-1">
        <span>Less</span>
        {levels.map((cls) => (
          <span key={cls} className={`size-2.5 rounded-[2px] ${cls}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export function buildWeeks<T extends { date: string; level: 0 | 1 | 2 | 3 | 4 }>(cells: T[], weekCount = 17) {
  const byDate = new Map(cells.map((cell) => [cell.date, cell]));
  const last = cells[cells.length - 1]?.date;
  if (!last) return [] as T[][];
  const end = new Date(`${last}T12:00:00`);
  const day = end.getDay();
  const sunday = new Date(end);
  sunday.setDate(end.getDate() + (day === 0 ? 0 : 7 - day));
  const start = new Date(sunday);
  start.setDate(sunday.getDate() - weekCount * 7 + 1);

  const weeks: T[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < weekCount; w += 1) {
    const week: T[] = [];
    for (let d = 0; d < 7; d += 1) {
      const local = toISODate(cursor);
      const found = byDate.get(local);
      week.push(
        found ??
          ({
            date: local,
            level: 0,
          } as T),
      );
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`rounded-3xl bg-card border border-line/70 p-4 ${className}`}>{children}</section>;
}
