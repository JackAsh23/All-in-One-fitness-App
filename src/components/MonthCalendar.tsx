import { useState } from "react";
import { addDays, formatMonthYear, parseISODate, toISODate } from "../lib/dates";

type Props = {
  selected: string;
  marked: Set<string> | string[];
  onSelect: (iso: string) => void;
  accent?: string;
};

export function MonthCalendar({ selected, marked, onSelect, accent = "bg-life text-ink" }: Props) {
  const markedSet = marked instanceof Set ? marked : new Set(marked);
  const [cursor, setCursor] = useState(selected.slice(0, 7));
  const monthStart = `${cursor}-01`;
  const start = parseISODate(monthStart);
  const startWeekday = (start.getDay() + 6) % 7;
  const nextMonth = addDays(monthStart, 32).slice(0, 7);
  const daysInMonth = Number(addDays(`${nextMonth}-01`, -1).slice(8, 10));
  const cells: (string | null)[] = [...Array(startWeekday).fill(null)];
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(`${cursor}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const labelDate = toISODate(start);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className="rounded-full bg-ink px-3 py-1 text-sm text-snow"
          onClick={() => setCursor(addDays(monthStart, -1).slice(0, 7))}
        >
          ‹
        </button>
        <p className="text-sm font-medium">{formatMonthYear(labelDate)}</p>
        <button
          type="button"
          className="rounded-full bg-ink px-3 py-1 text-sm text-snow"
          onClick={() => setCursor(nextMonth)}
        >
          ›
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[10px] uppercase tracking-wide text-fog">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, index) => {
          if (!iso) return <span key={`e-${index}`} className="h-9" />;
          const isSelected = iso === selected;
          const has = markedSet.has(iso);
          const day = Number(iso.slice(8, 10));
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              className={`relative grid h-9 place-items-center rounded-xl text-sm ${
                isSelected ? accent : has ? "bg-ink text-snow" : "text-fog"
              }`}
            >
              {day}
              {has && !isSelected ? (
                <span className="absolute bottom-1 size-1 rounded-full bg-life" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
