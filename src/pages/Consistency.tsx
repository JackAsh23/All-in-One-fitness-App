import { useMemo, useState } from "react";
import { buildWeeks, Card, HeatLegend, Heatmap } from "../components/Heatmap";
import { addDays, daysInRange, formatLongDate, formatMonthYear, todayISO } from "../lib/dates";
import {
  heatLevelFromScore,
  mealHeatLevel,
  runHeatLevel,
  summarizeDay,
  workoutHeatLevel,
} from "../lib/scoring";
import { useAppState } from "../lib/store";

export function ConsistencyPage() {
  const state = useAppState();
  const today = todayISO();
  const [selected, setSelected] = useState(today);

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
          steps: heatLevelFromScore(Math.round((day.steps / state.profile.stepGoal) * 100)),
          summary: day,
        };
      }),
    [range, state],
  );

  const unified = buildWeeks(cells.map((cell) => ({ date: cell.date, level: cell.level })));
  const runWeeks = buildWeeks(cells.map((cell) => ({ date: cell.date, level: cell.run })));
  const liftWeeks = buildWeeks(cells.map((cell) => ({ date: cell.date, level: cell.workout })));
  const mealWeeks = buildWeeks(cells.map((cell) => ({ date: cell.date, level: cell.meal })));

  const month = today.slice(0, 7);
  const monthCells = cells.filter((cell) => cell.date.startsWith(month));
  const monthKm = monthCells.reduce((sum, cell) => sum + cell.summary.runKm, 0);
  const monthWorkouts = monthCells.reduce((sum, cell) => sum + cell.summary.workoutCount, 0);
  const monthLogged = monthCells.filter((cell) => cell.summary.mealsLogged > 0).length;
  const monthSteps =
    monthCells.reduce((sum, cell) => sum + cell.summary.steps, 0) / Math.max(monthCells.length, 1);
  const monthScore = Math.round(monthCells.reduce((sum, cell) => sum + cell.score, 0) / Math.max(monthCells.length, 1));

  const selectedDay = summarizeDay(state, selected);
  const checks = [
    { label: "Run", ok: selectedDay.runKm > 0 },
    { label: "Step goal", ok: selectedDay.steps >= state.profile.stepGoal },
    { label: "Workout", ok: selectedDay.workoutCount > 0 },
    { label: "Meals", ok: selectedDay.mealsLogged >= 3 },
  ];

  return (
    <div className="space-y-4 animate-pop">
      <h2 className="text-2xl font-semibold">Consistency</h2>
      <Card>
        <p className="text-xs uppercase tracking-[0.18em] text-life">This month</p>
        <p className="mt-1 text-lg font-semibold">{formatMonthYear(today)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <p>🏃 {monthKm.toFixed(0)} km</p>
          <p>💪 {monthWorkouts} workouts</p>
          <p>🍱 {monthLogged} days logged</p>
          <p>👟 {Math.round(monthSteps).toLocaleString()} avg steps</p>
        </div>
        <p className="mt-3 font-mono text-life">Consistency {monthScore}%</p>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold">Unified heatmap</h3>
        <Heatmap weeks={unified} selected={selected} onSelect={setSelected} />
        <HeatLegend label="GitHub-style body graph" />
      </Card>

      <Card>
        <h3 className="mb-2 font-semibold">{formatLongDate(selected)}</h3>
        <p className="mb-3 font-mono text-3xl text-life">{selectedDay.score}%</p>
        <ul className="space-y-2 text-sm">
          {checks.map((item) => (
            <li key={item.label} className="flex justify-between rounded-2xl bg-ink px-3 py-2">
              <span>{item.label}</span>
              <span className={item.ok ? "text-life" : "text-fog"}>{item.ok ? "✓" : "—"}</span>
            </li>
          ))}
        </ul>
        {selectedDay.workoutName ? (
          <p className="mt-3 text-sm text-fog">
            {selectedDay.workoutName} · {selectedDay.workoutSets} sets · {selectedDay.workoutMinutes} min
          </p>
        ) : null}
        {selectedDay.runKm ? (
          <p className="mt-1 text-sm text-fog">{selectedDay.runKm.toFixed(1)} km run</p>
        ) : null}
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold">Running</h3>
        <Heatmap weeks={runWeeks} selected={selected} onSelect={setSelected} />
        <HeatLegend label="Distance intensity" />
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold">Workout</h3>
        <Heatmap weeks={liftWeeks} selected={selected} onSelect={setSelected} />
        <HeatLegend label="Trained vs rest" />
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold">Meal logging</h3>
        <Heatmap weeks={mealWeeks} selected={selected} onSelect={setSelected} />
        <HeatLegend label="Did you log — not guilt" />
      </Card>
    </div>
  );
}
