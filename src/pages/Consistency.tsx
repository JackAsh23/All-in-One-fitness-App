import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { buildWeeks, Card, HeatLegend, Heatmap } from "../components/Heatmap";
import { addDays, daysInRange, formatLongDate, todayISO } from "../lib/dates";
import { buildYearWrapped, recentMonthRecaps, scoreGrade, streakLabel } from "../lib/consistency";
import { GOAL_MODES } from "../lib/goalModes";
import {
  currentStreak,
  heatLevelFromScore,
  mealHeatLevel,
  runHeatLevel,
  summarizeDay,
  workoutHeatLevel,
} from "../lib/scoring";
import { setGoalMode, useAppState } from "../lib/store";

export function ConsistencyPage() {
  const state = useAppState();
  const today = todayISO();
  const [selected, setSelected] = useState(today);
  const wrapped = buildYearWrapped(state);
  const monthRecaps = recentMonthRecaps(state, 3);

  const range = daysInRange(addDays(today, -119), today);
  const cells = useMemo(
    () =>
      range.map((date) => {
        const day = summarizeDay(state, date);
        return {
          date,
          score: day.score,
          level: heatLevelFromScore(day.score),
          run: runHeatLevel(day.runKm),
          workout: workoutHeatLevel(day.workoutCount),
          meal: mealHeatLevel(day.mealsLogged),
          summary: day,
        };
      }),
    [range, state],
  );

  const unified = buildWeeks(cells.map((cell) => ({ date: cell.date, level: cell.level })));
  const runWeeks = buildWeeks(cells.map((cell) => ({ date: cell.date, level: cell.run })));
  const liftWeeks = buildWeeks(cells.map((cell) => ({ date: cell.date, level: cell.workout })));
  const mealWeeks = buildWeeks(cells.map((cell) => ({ date: cell.date, level: cell.meal })));

  const streak = currentStreak(today, (date) => summarizeDay(state, date).score >= 50);
  const selectedDay = summarizeDay(state, selected);
  const activeMode = GOAL_MODES.find((m) => m.id === state.profile.goalMode) ?? GOAL_MODES[0];

  const pillars = [
    { key: "movement", label: "Movement", emoji: "🏃", value: selectedDay.parts.movement, max: selectedDay.partsMax.movement, enabled: state.profile.priorities.running },
    { key: "training", label: "Training", emoji: "💪", value: selectedDay.parts.training, max: selectedDay.partsMax.training, enabled: state.profile.priorities.strength },
    { key: "nutrition", label: "Nutrition", emoji: "🍱", value: selectedDay.parts.nutrition, max: selectedDay.partsMax.nutrition, enabled: state.profile.priorities.nutrition },
    { key: "activity", label: "Daily activity", emoji: "👟", value: selectedDay.parts.activity, max: selectedDay.partsMax.activity, enabled: state.profile.priorities.steps },
  ].filter((p) => p.enabled && p.max > 0);

  return (
    <div className="space-y-4 animate-pop">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-life">Phase 6</p>
          <h2 className="text-2xl font-semibold">Consistency OS</h2>
        </div>
        <Link to="/wrapped" className="flex items-center gap-1 text-sm text-life">
          <Sparkles size={14} />
          Wrapped
        </Link>
      </div>

      <Card className="border-life/30 bg-gradient-to-br from-life/10 to-card">
        <p className="text-xs uppercase tracking-[0.18em] text-fog">Today&apos;s score</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="font-mono text-5xl font-semibold text-life">{selectedDay.score}</p>
          <div className="text-right">
            <p className="text-sm font-medium">{scoreGrade(selectedDay.score)}</p>
            <p className="text-xs text-fog">
              {streak} day streak · {streakLabel(streak)}
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {pillars.map((pillar) => (
            <li key={pillar.key}>
              <div className="mb-1 flex justify-between text-sm">
                <span>
                  {pillar.emoji} {pillar.label}
                </span>
                <span className="font-mono text-fog">
                  {pillar.value}/{pillar.max}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink">
                <div
                  className="h-full rounded-full bg-life"
                  style={{ width: `${pillar.max ? (pillar.value / pillar.max) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h3 className="mb-2 font-semibold">Goal mode</h3>
        <p className="mb-3 text-xs text-fog">{activeMode.emoji} {activeMode.blurb}</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {GOAL_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setGoalMode(mode.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                state.profile.goalMode === mode.id ? "bg-life text-ink" : "bg-ink text-fog"
              }`}
            >
              {mode.emoji} {mode.label}
            </button>
          ))}
        </div>
      </Card>

      <Link
        to="/wrapped"
        className="block rounded-3xl border border-life/40 bg-gradient-to-r from-life/20 to-run/10 px-4 py-4"
      >
        <p className="text-xs uppercase tracking-[0.18em] text-life">{wrapped.year} Wrapped</p>
        <p className="mt-1 font-semibold">
          {wrapped.totalKm} km · {wrapped.totalWorkouts} workouts · {wrapped.avgScore}% consistency
        </p>
        <p className="mt-1 text-sm text-fog">Strongest month: {wrapped.bestMonth}</p>
      </Link>

      {monthRecaps.map((recap) => (
        <Card key={recap.month}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{recap.label}</h3>
            <span className="font-mono text-life">{recap.score}%</span>
          </div>
          <p className="mt-2 text-sm text-fog">
            {recap.km} km · {recap.workouts} workouts · {recap.loggedDays} days logged
          </p>
        </Card>
      ))}

      <Card>
        <h3 className="mb-3 font-semibold">Unified heatmap</h3>
        <Heatmap weeks={unified} selected={selected} onSelect={setSelected} />
        <HeatLegend label="Your body&apos;s GitHub graph" />
      </Card>

      <Card>
        <h3 className="mb-2 font-semibold">{formatLongDate(selected)}</h3>
        <p className="mb-3 font-mono text-3xl text-life">{selectedDay.score}%</p>
        {selectedDay.workoutName ? (
          <p className="text-sm text-fog">
            {selectedDay.workoutName} · {selectedDay.workoutSets} sets
          </p>
        ) : null}
        {selectedDay.runKm ? <p className="text-sm text-fog">{selectedDay.runKm.toFixed(1)} km run</p> : null}
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold">Running</h3>
          <Heatmap weeks={runWeeks} selected={selected} onSelect={setSelected} palette="run" />
          <HeatLegend label="Distance intensity" palette="run" />
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold">Workout</h3>
          <Heatmap weeks={liftWeeks} selected={selected} onSelect={setSelected} palette="lift" />
          <HeatLegend label="Trained vs rest" palette="lift" />
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold">Meal logging</h3>
          <Heatmap weeks={mealWeeks} selected={selected} onSelect={setSelected} palette="eat" />
          <HeatLegend label="Logged — not guilt" palette="eat" />
      </Card>
    </div>
  );
}
