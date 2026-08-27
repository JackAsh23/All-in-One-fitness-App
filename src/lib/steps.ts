import { todayISO } from "./dates";
import type { AppState, RunLog } from "./types";

/** Typical walking cadence. Running stride is longer, so fewer steps per km. */
export const WALK_STEPS_PER_KM = 1400;
export const RUN_STEPS_PER_KM = 1250;

export function gpsStepsFromRuns(runs: RunLog[], date: string): number {
  const total = runs
    .filter((run) => run.date === date)
    .reduce((sum, run) => {
      const perKm = run.kind === "walk" ? WALK_STEPS_PER_KM : RUN_STEPS_PER_KM;
      return sum + run.distanceKm * perKm;
    }, 0);
  return Math.round(total);
}

/** Steps the user typed on Stats. Demo history is trusted; live fake Health sync is not. */
export function trustedLoggedSteps(state: AppState, date: string): number {
  const log = state.steps.find((entry) => entry.date === date);
  if (!log || log.steps <= 0) return 0;
  if (log.source === "manual") return log.steps;
  if (state.dataMode === "demo") return log.steps;
  return 0;
}

export function stepsForDay(state: AppState, date: string): number {
  return Math.max(trustedLoggedSteps(state, date), gpsStepsFromRuns(state.runs, date));
}

export function stepsSourceLabel(state: AppState, date: string): string {
  const gps = gpsStepsFromRuns(state.runs, date);
  const logged = trustedLoggedSteps(state, date);
  if (logged > 0 && gps > 0) return logged >= gps ? "Logged on Stats" : "From GPS";
  if (logged > 0) return "Logged on Stats";
  if (gps > 0) return "From GPS walks and runs";
  return "No steps yet";
}

export function dailyStepSeries(state: AppState, days = 56): { date: string; steps: number }[] {
  const today = todayISO();
  const series: { date: string; steps: number }[] = [];
  const start = new Date(`${today}T12:00:00`);
  start.setDate(start.getDate() - (days - 1));
  for (let i = 0; i < days; i += 1) {
    const cursor = new Date(start);
    cursor.setDate(start.getDate() + i);
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    series.push({ date, steps: stepsForDay(state, date) });
  }
  return series;
}

export function stepHeatLevel(steps: number, goal: number): 0 | 1 | 2 | 3 | 4 {
  if (steps <= 0) return 0;
  const pct = steps / Math.max(goal, 1);
  if (pct < 0.25) return 1;
  if (pct < 0.5) return 2;
  if (pct < 0.8) return 3;
  return 4;
}
