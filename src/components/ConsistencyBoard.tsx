import { Check, Dumbbell, PersonStanding, Salad } from "lucide-react";
import type { DaySummary, Priorities } from "../lib/types";
import { mealHeatLevel, runHeatLevel, workoutHeatLevel } from "../lib/scoring";
import { stepHeatLevel } from "../lib/steps";

type PillarKey = "movement" | "training" | "nutrition" | "activity";

const PILLARS: {
  key: PillarKey;
  label: string;
  color: string;
  heat: readonly [string, string, string, string, string];
  Icon: typeof PersonStanding;
  enabled: (p: Priorities) => boolean;
  level: (day: DaySummary, stepGoal: number) => 0 | 1 | 2 | 3 | 4;
}[] = [
  {
    key: "movement",
    label: "Movement",
    color: "#ff6b4a",
    heat: ["#243040", "#3d1a12", "#7a2e1c", "#c44a2a", "#ff6b4a"],
    Icon: PersonStanding,
    enabled: (p) => p.running,
    level: (day) => runHeatLevel(day.runKm),
  },
  {
    key: "training",
    label: "Training",
    color: "#7aa6ff",
    heat: ["#243040", "#152544", "#2c4a86", "#4e78d4", "#7aa6ff"],
    Icon: Dumbbell,
    enabled: (p) => p.strength,
    level: (day) => workoutHeatLevel(day.workoutCount),
  },
  {
    key: "nutrition",
    label: "Nutrition",
    color: "#ffc857",
    heat: ["#243040", "#3d3010", "#7a5f18", "#c49a2e", "#ffc857"],
    Icon: Salad,
    enabled: (p) => p.nutrition,
    level: (day) => mealHeatLevel(day.mealsLogged),
  },
  {
    key: "activity",
    label: "Activity",
    color: "#5eead4",
    heat: ["#243040", "#134e4a", "#0f766e", "#2dd4bf", "#5eead4"],
    Icon: Check,
    enabled: (p) => p.steps,
    level: (day, goal) => stepHeatLevel(day.steps, goal),
  },
];

export function ConsistencyBoard({
  days,
  selected,
  stepGoal,
  priorities,
  compact = false,
}: {
  days: DaySummary[];
  selected: DaySummary;
  stepGoal: number;
  priorities: Priorities;
  compact?: boolean;
}) {
  const pillars = PILLARS.filter((pillar) => pillar.enabled(priorities) && selected.partsMax[pillar.key] > 0);
  const size = compact ? 168 : 196;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = compact ? 12 : 14;
  const radii = pillars.map((_, index) => size / 2 - stroke / 2 - 4 - index * (stroke + 4));

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className={`flex items-center ${compact ? "gap-3" : "gap-4"}`}>
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            {pillars.map((pillar, ring) => {
              const r = radii[ring];
              const c = 2 * Math.PI * r;
              const pct = selected.partsMax[pillar.key]
                ? Math.min(1, selected.parts[pillar.key] / selected.partsMax[pillar.key])
                : 0;
              return (
                <g key={pillar.key} transform={`rotate(-90 ${cx} ${cy})`}>
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="#243040" strokeWidth={stroke} />
                  {pct > 0 ? (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke={pillar.color}
                      strokeWidth={stroke}
                      strokeLinecap="round"
                      strokeDasharray={`${c * pct} ${c}`}
                    />
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>
        <ul className="min-w-0 flex-1 space-y-2.5">
          {pillars.map((pillar) => (
            <li key={pillar.key}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-1.5 text-fog">
                  <pillar.Icon size={14} style={{ color: pillar.color }} />
                  {pillar.label}
                </span>
                <span className="font-mono text-snow">
                  {selected.parts[pillar.key]}/{selected.partsMax[pillar.key]}
                </span>
              </div>
              <div className="mt-1 flex gap-[3px]">
                {days.map((day) => {
                  const level = pillar.level(day, stepGoal);
                  return (
                    <span
                      key={`${pillar.key}-dot-${day.date}`}
                      title={day.date}
                      className="h-2.5 flex-1 rounded-[3px]"
                      style={{
                        background: pillar.heat[level],
                        boxShadow: day.date === selected.date ? `0 0 0 1px ${pillar.color}` : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </div>
      {compact ? null : (
        <p className="text-[11px] text-fog">
          Rings are today’s fill. The squares are a 7-day heatmap — Movement, Training, Nutrition, Activity.
        </p>
      )}
    </div>
  );
}
