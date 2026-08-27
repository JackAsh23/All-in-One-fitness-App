import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Flame, PersonStanding, Salad, Dumbbell, Footprints, BarChart3 } from "lucide-react";
import { Card } from "../components/Heatmap";
import { MacroBar, ProgressRing } from "../components/Progress";
import { SyncBanner } from "../components/SyncBanner";
import { formatDuration, formatLongDate, formatPace, formatTimeLabel, todayISO } from "../lib/dates";
import { currentStreak, summarizeDay } from "../lib/scoring";
import { useAppState } from "../lib/store";

export function HomePage() {
  const state = useAppState();
  const today = todayISO();
  const day = summarizeDay(state, today);
  const streak = currentStreak(today, (date) => summarizeDay(state, date).score >= 50);

  const timeline = [
    ...state.runs
      .filter((run) => run.date === today)
      .map((run) => ({
        time: run.time,
        label: `${run.distanceKm.toFixed(1)} km ${run.kind === "walk" ? "Walk" : "Run"}${run.source && run.source !== "manual" ? ` · ${run.source.replace("-", " ")}` : ""}`,
        icon: "run" as const,
      })),
    ...state.workouts
      .filter((workout) => workout.date === today)
      .map((workout) => ({
        time: workout.time,
        label: `${workout.template} Workout`,
        icon: "lift" as const,
      })),
    ...state.foods
      .filter((food) => food.date === today)
      .reduce<{ time: string; label: string; icon: "eat" }[]>((acc, food) => {
        if (!acc.some((item) => item.label.toLowerCase().startsWith(food.meal))) {
          acc.push({
            time: food.time,
            label: `${food.meal[0].toUpperCase()}${food.meal.slice(1)} Logged`,
            icon: "eat",
          });
        }
        return acc;
      }, []),
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-fog text-sm">{formatLongDate(today)}</p>
        <h2 className="text-2xl font-semibold tracking-tight">
          {day.score >= 80 ? "Great day, " : streak === 0 && timeline.length === 0 ? "Day one, " : "Let’s stack a day, "}
          {state.profile.name}.
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Link
          to="/run?start=1"
          className="tap-scale rounded-3xl bg-run/15 px-2 py-3 text-center"
        >
          <PersonStanding className="mx-auto text-run" size={22} />
          <p className="mt-1 text-xs font-semibold text-run">Start run</p>
        </Link>
        <Link
          to="/nutrition?log=1"
          className="tap-scale rounded-3xl bg-eat/15 px-2 py-3 text-center"
        >
          <Salad className="mx-auto text-eat" size={22} />
          <p className="mt-1 text-xs font-semibold text-eat">Log food</p>
        </Link>
        <Link
          to="/workout"
          className="tap-scale rounded-3xl bg-lift/15 px-2 py-3 text-center"
        >
          <Dumbbell className="mx-auto text-lift" size={22} />
          <p className="mt-1 text-xs font-semibold text-lift">Lift</p>
        </Link>
      </div>

      <p className="text-center text-sm text-fog">
        {Math.max(0, state.profile.calorieGoal - day.calories)} kcal left · {Math.max(0, state.profile.proteinGoal - day.protein)}g protein left
      </p>

      <SyncBanner />

      <Card className="bg-gradient-to-br from-card to-ink-2">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-fog">Consistency score</p>
            <p className="font-mono text-5xl font-semibold text-life">{day.score}</p>
          </div>
          <div className="rounded-full bg-life/15 px-3 py-1 text-sm text-life">
            <Flame className="mr-1 inline" size={14} />
            {streak} day streak
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {day.partsMax.movement > 0 ? (
            <ScoreChip label="Movement" value={day.parts.movement} max={day.partsMax.movement} color="text-run" />
          ) : null}
          {day.partsMax.training > 0 ? (
            <ScoreChip label="Training" value={day.parts.training} max={day.partsMax.training} color="text-lift" />
          ) : null}
          {day.partsMax.nutrition > 0 ? (
            <ScoreChip label="Nutrition" value={day.parts.nutrition} max={day.partsMax.nutrition} color="text-eat" />
          ) : null}
          {day.partsMax.activity > 0 ? (
            <ScoreChip label="Activity" value={day.parts.activity} max={day.partsMax.activity} color="text-step" />
          ) : null}
        </div>
        <Link to="/consistency" className="mt-3 inline-block text-xs text-life">
          Consistency OS · {streak} day streak →
        </Link>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          to="/analytics"
          icon={<BarChart3 size={18} />}
          label="Insights"
          value={`${day.score}% score`}
          sub="Pace, volume, macros"
          color="text-life"
        />
        <StatTile
          to="/nutrition"
          icon={<Salad size={18} />}
          label="Calories"
          value={`${day.calories} / ${state.profile.calorieGoal}`}
          sub={`${day.protein}g protein`}
          color="text-eat"
        />
        <StatTile
          to="/analytics?tab=steps"
          icon={<Footprints size={18} />}
          label="Steps"
          value={`${day.steps.toLocaleString()} / ${state.profile.stepGoal.toLocaleString()}`}
          sub="Today’s total"
          color="text-step"
        />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Today’s timeline</h3>
          <Link to="/consistency" className="text-sm text-life">
            Heatmap
          </Link>
        </div>
        {timeline.length === 0 ? (
          <p className="text-sm text-fog">Nothing logged yet. A run, a session, or lunch is enough to light the day.</p>
        ) : (
          <ul className="space-y-3">
            {timeline.map((item) => (
              <li key={`${item.time}-${item.label}`} className="flex items-center gap-3">
                <span className="w-16 font-mono text-xs text-fog">{formatTimeLabel(item.time)}</span>
                <span
                  className={`size-2 rounded-full ${
                    item.icon === "run" ? "bg-run" : item.icon === "lift" ? "bg-lift" : "bg-eat"
                  }`}
                />
                <span>{item.label}</span>
              </li>
            ))}
            <li className="flex items-center gap-3">
              <span className="w-16 font-mono text-xs text-fog">Now</span>
              <span className="size-2 rounded-full bg-step" />
              <span>{day.steps.toLocaleString()} steps</span>
            </li>
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold">Fuel</h3>
        <div className="mb-4 flex justify-around">
          <ProgressRing value={day.calories} max={state.profile.calorieGoal} color="#ffc857" label="kcal" />
          <ProgressRing value={day.protein} max={state.profile.proteinGoal} color="#3ee07f" label="protein" />
        </div>
        <div className="space-y-3">
          <MacroBar label="Carbs" value={day.carbs} goal={state.profile.carbGoal} color="#7aa6ff" />
          <MacroBar label="Fat" value={day.fat} goal={state.profile.fatGoal} color="#ff6b4a" />
        </div>
      </Card>

      {day.runKm > 0 ? (
        <p className="px-1 text-center text-xs text-fog">
          Morning run {formatDuration(day.runDurationSec)} · {formatPace(day.runDurationSec, day.runKm)}
        </p>
      ) : null}
    </div>
  );
}

function ScoreChip({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-ink/60 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-fog">{label}</p>
      <p className={`font-mono text-lg ${color}`}>
        {value}/{max}
      </p>
    </div>
  );
}

function StatTile({
  to,
  icon,
  label,
  value,
  sub,
  color,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <Link to={to} className="rounded-3xl border border-line bg-card p-4">
      <div className={`mb-3 ${color}`}>{icon}</div>
      <p className="text-xs uppercase tracking-wide text-fog">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-fog">{sub}</p>
    </Link>
  );
}
