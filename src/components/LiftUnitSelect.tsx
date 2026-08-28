import { ChevronDown } from "lucide-react";
import type { LiftUnit } from "../lib/exerciseTiming";

export function LiftUnitSelect({
  value,
  onChange,
  className = "",
  testId,
  compact = false,
}: {
  value: LiftUnit;
  onChange: (unit: LiftUnit) => void;
  className?: string;
  testId?: string;
  compact?: boolean;
}) {
  return (
    <span className={`relative block ${className}`}>
      <select
        value={value}
        data-testid={testId}
        aria-label="Reps or time"
        onChange={(event) => onChange(event.target.value as LiftUnit)}
        className={
          compact
            ? "w-full appearance-none rounded-xl border border-line bg-ink px-1.5 py-2 pr-5 text-center text-sm text-snow outline-none"
            : "w-full appearance-none rounded-2xl border border-line bg-ink px-3 py-3 pr-10 text-base text-snow outline-none"
        }
      >
        <option value="reps">Reps</option>
        <option value="time">Time</option>
      </select>
      <ChevronDown
        size={compact ? 14 : 18}
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-fog ${compact ? "right-1" : "right-3"}`}
      />
    </span>
  );
}
