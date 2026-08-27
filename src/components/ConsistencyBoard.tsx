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
    heat: ["#161b22", "#3d1a12", "#7a2e1c", "#c44a2a", "#ff6b4a"],
    Icon: PersonStanding,
    enabled: (p) => p.running,
    level: (day) => runHeatLevel(day.runKm),
  },
  {
    key: "training",
    label: "Training",
    color: "#7aa6ff",
    heat: ["#161b22", "#152544", "#2c4a86", "#4e78d4", "#7aa6ff"],
    Icon: Dumbbell,
    enabled: (p) => p.strength,
    level: (day) => workoutHeatLevel(day.workoutCount),
  },
  {
    key: "nutrition",
    label: "Nutrition",
    color: "#ffc857",
    heat: ["#161b22", "#3d3010", "#7a5f18", "#c49a2e", "#ffc857"],
    Icon: Salad,
    enabled: (p) => p.nutrition,
    level: (day) => mealHeatLevel(day.mealsLogged),
  },
  {
    key: "activity",
    label: "Activity",
    color: "#5eead4",
    heat: ["#161b22", "#134e4a", "#0f766e", "#2dd4bf", "#5eead4"],
    Icon: Check,
    enabled: (p) => p.steps,
    level: (day, goal) => stepHeatLevel(day.steps, goal),
  },
];

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

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
  const stroke = compact ? 11 : 13;
  const gap = 5;
  const radii = pillars.map((_, index) => size / 2 - stroke / 2 - 2 - index * (stroke + 5));
  const n = Math.max(days.length, 1);
  const slice = 360 / n;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className={`flex items-center ${compact ? "gap-3" : "gap-4"}`}>
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            {pillars.map((pillar, ring) => {
              const r = radii[ring];
              const todayPct = selected.partsMax[pillar.key]
                ? Math.min(1, selected.parts[pillar.key] / selected.partsMax[pillar.key])
                : 0;
              return (
                <g key={pillar.key}>
                  {days.map((day, i) => {
                    const level = pillar.level(day, stepGoal);
                    const start = -90 + i * slice + gap / 2;
                    const end = -90 + (i + 1) * slice - gap / 2;
                    const isToday = day.date === selected.date;
                    return (
                      <path
                        key={`${pillar.key}-${day.date}`}
                        d={arcPath(cx, cy, r, start, end)}
                        fill="none"
                        stroke={pillar.heat[level]}
                        strokeWidth={isToday ? stroke + 1.5 : stroke}
                        strokeLinecap="round"
                        opacity={isToday ? 1 : 0.78}
                      />
                    );
                  })}
                  {todayPct > 0 ? (
                    <path
                      d={arcPath(cx, cy, r, -90, -90 + Math.max(8, todayPct * 360 - 2))}
                      fill="none"
                      stroke={pillar.color}
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                  ) : null}
                </g>
              );
            })}
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className={`font-mono font-semibold text-life ${compact ? "text-3xl" : "text-4xl"}`}>{selected.score}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-fog">Score</p>
            </div>
          </div>
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
                      className="h-2 flex-1 rounded-[2px]"
                      style={{
                        background: pillar.heat[level],
                        outline: day.date === selected.date ? "1px solid #f4f7fa" : undefined,
                        outlineOffset: 1,
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
          Outer to inner: Movement, Training, Nutrition, Activity. Squares are the last 7 days.
        </p>
      )}
    </div>
  );
}
