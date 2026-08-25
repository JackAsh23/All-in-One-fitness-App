import { addDays, formatMonthYear, todayISO } from "./dates";
import { summarizeDay, currentStreak, heatLevelFromScore } from "./scoring";
import type { AppState } from "./types";

export type YearWrapped = {
  year: number;
  totalKm: number;
  totalWorkouts: number;
  totalSteps: number;
  daysLogged: number;
  proteinGoalDays: number;
  avgScore: number;
  longestStreak: number;
  bestMonth: string;
  bestMonthScore: number;
  hottestDay: string;
  hottestScore: number;
  topFood: string;
};

export type MonthRecap = {
  month: string;
  label: string;
  score: number;
  km: number;
  workouts: number;
  loggedDays: number;
};

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export function buildYearWrapped(state: AppState, year = new Date().getFullYear()): YearWrapped {
  const prefix = String(year);
  const runs = state.runs.filter((r) => r.date.startsWith(prefix));
  const workouts = state.workouts.filter((w) => w.date.startsWith(prefix));
  const steps = state.steps.filter((s) => s.date.startsWith(prefix));
  const foods = state.foods.filter((f) => f.date.startsWith(prefix));

  const days = new Set([...runs.map((r) => r.date), ...workouts.map((w) => w.date), ...foods.map((f) => f.date)]);
  let proteinGoalDays = 0;
  let scoreSum = 0;
  let scoreCount = 0;
  let hottestDay = todayISO();
  let hottestScore = 0;

  const monthScores = new Map<string, { sum: number; count: number }>();

  for (const date of days) {
    const day = summarizeDay(state, date);
    scoreSum += day.score;
    scoreCount += 1;
    if (day.score > hottestScore) {
      hottestScore = day.score;
      hottestDay = date;
    }
    if (day.protein >= state.profile.proteinGoal * 0.9) proteinGoalDays += 1;

    const mk = monthKey(date);
    const bucket = monthScores.get(mk) ?? { sum: 0, count: 0 };
    bucket.sum += day.score;
    bucket.count += 1;
    monthScores.set(mk, bucket);
  }

  let bestMonth = prefix + "-01";
  let bestMonthScore = 0;
  for (const [mk, bucket] of monthScores) {
    const avg = bucket.sum / bucket.count;
    if (avg > bestMonthScore) {
      bestMonthScore = avg;
      bestMonth = mk + "-15";
    }
  }

  const foodCounts = new Map<string, number>();
  for (const food of foods) {
    foodCounts.set(food.name, (foodCounts.get(food.name) ?? 0) + 1);
  }
  const topFood = [...foodCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Chicken breast";

  const today = todayISO();
  const longestStreak = currentStreak(today, (date) => {
    if (!date.startsWith(prefix)) return false;
    return summarizeDay(state, date).score >= 50;
  });

  return {
    year,
    totalKm: Math.round(runs.reduce((s, r) => s + r.distanceKm, 0)),
    totalWorkouts: workouts.length,
    totalSteps: steps.reduce((s, e) => s + e.steps, 0),
    daysLogged: new Set(foods.map((f) => f.date)).size,
    proteinGoalDays,
    avgScore: scoreCount ? Math.round(scoreSum / scoreCount) : 0,
    longestStreak,
    bestMonth: formatMonthYear(bestMonth),
    bestMonthScore: Math.round(bestMonthScore),
    hottestDay,
    hottestScore,
    topFood: topFood.split(",")[0],
  };
}

export function recentMonthRecaps(state: AppState, count = 4): MonthRecap[] {
  const today = todayISO();
  const out: MonthRecap[] = [];
  for (let i = 0; i < count; i += 1) {
    const anchor = addDays(today, -i * 30);
    const mk = monthKey(anchor);
    const cells: ReturnType<typeof summarizeDay>[] = [];
    let cursor = mk + "-01";
    while (cursor.startsWith(mk)) {
      cells.push(summarizeDay(state, cursor));
      cursor = addDays(cursor, 1);
      if (cursor.slice(0, 7) !== mk) break;
    }
    if (cells.length === 0) continue;
    out.push({
      month: mk,
      label: formatMonthYear(anchor),
      score: Math.round(cells.reduce((s, c) => s + c.score, 0) / cells.length),
      km: Math.round(cells.reduce((s, c) => s + c.runKm, 0)),
      workouts: cells.reduce((s, c) => s + c.workoutCount, 0),
      loggedDays: cells.filter((c) => c.mealsLogged > 0).length,
    });
  }
  return out;
}

export function scoreGrade(score: number): string {
  if (score >= 90) return "Legendary";
  if (score >= 75) return "Solid";
  if (score >= 50) return "Building";
  return "Restart";
}

export function streakLabel(days: number): string {
  if (days >= 30) return "Unstoppable";
  if (days >= 14) return "On fire";
  if (days >= 7) return "Heating up";
  if (days >= 3) return "Momentum";
  return "Day one";
}

export { heatLevelFromScore };
