import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { ConsistencyBoard } from "../components/ConsistencyBoard";
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
import { stepHeatLevel } from "../lib/steps";
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
          activity: stepHeatLevel(day.steps, state.profile.stepGoal),
          summary: day,
        };
      }),
    [range, state],
  );

  const unified = buildWeeks(cells.map((cell) => ({ date: cell.date, level: cell.level })));
  const runWeeks = buildWeeks(cells.map((cell) => ({ date: cell.date, level: cell.run })));
  const liftWeeks = buildWeeks(cells.map((cell) => ({ date: cell.date, level: cell.workout })));
  const mealWeeks = buildWeeks(cells.map((cell) => ({ date: cell.date, level: cell.meal })));
  const activityWeeks = buildWeeks(cells.map((cell) => ({ date: cell.date, level: cell.activity })));

  const streak = currentStreak(today, (date) => summarizeDay(state, date).score >= 50);
  const selectedDay = summarizeDay(state, selected);
  const selectedWeek = Array.from({ length: 7 }, (_, index) => summarizeDay(state, addDays(selected, index - 6)));
  const hasHistory = state.runs.length + state.workouts.length + state.foods.length + state.weightLogs.length > 0;
  const activeMode = GOAL_MODES.find((m) => m.id === state.profile.goalMode) ?? GOAL_MODES[0];

  return (
    <div className="space-y-4">
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

      {!hasHistory ? (
        <Card className="border-life/30 bg-life/5">
          <p className="font-semibold">Heatmaps start empty</p>
          <p className="mt-1 text-sm text-fog">
            Log a run, a lift, or a meal today. The first green square is the whole point.
          </p>
          <div className="mt-3 flex gap-2">
            <Link to="/run?start=1" className="rounded-full bg-run/20 px-3 py-1.5 text-sm text-run">
              Run
            </Link>
            <Link to="/nutrition?log=1" className="rounded-full bg-eat/20 px-3 py-1.5 text-sm text-eat">
              Eat
            </Link>
            <Link to="/workout?start=1" className="rounded-full bg-lift/20 px-3 py-1.5 text-sm text-lift">
              Lift
            </Link>
          </div>
        </Card>
      ) : null}

      <Card className="border-life/30 bg-gradient-to-br from-life/10 to-card">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-fog">Consistency board</p>
            <p className="text-sm font-medium">{scoreGrade(selectedDay.score)}</p>
          </div>
          <p className="text-xs text-fog">
            {streak} day streak · {streakLabel(streak)}
          </p>
        </div>
        <ConsistencyBoard
          days={selectedWeek}
          selected={selectedDay}
          stepGoal={state.profile.stepGoal}
          priorities={state.profile.priorities}
        />
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
      <Card>
        <h3 className="mb-3 font-semibold">Activity</h3>
          <Heatmap weeks={activityWeeks} selected={selected} onSelect={setSelected} palette="step" />
          <HeatLegend label="Steps from GPS and Stats" palette="step" />
      </Card>
    </div>
  );
}
