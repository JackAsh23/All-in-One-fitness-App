import type { AppState, DaySummary, Profile, Priorities } from "./types";

const WEIGHTS = {
  running: 30,
  strength: 25,
  nutrition: 25,
  steps: 20,
  mobility: 0,
} as const;

export function priorityWeights(profile: Profile) {
  const p = profile.priorities;
  return {
    movement: p.running ? WEIGHTS.running : 0,
    training: p.strength ? WEIGHTS.strength : 0,
    nutrition: p.nutrition ? WEIGHTS.nutrition : 0,
    activity: p.steps ? WEIGHTS.steps : 0,
  };
}

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

export function summarizeDay(state: AppState, date: string): DaySummary {
  const runs = state.runs.filter((run) => run.date === date);
  const workouts = state.workouts.filter((workout) => workout.date === date);
  const foods = state.foods.filter((food) => food.date === date);
  const steps = state.steps.find((entry) => entry.date === date)?.steps ?? 0;

  const runKm = runs.reduce((sum, run) => sum + run.distanceKm, 0);
  const runDurationSec = runs.reduce((sum, run) => sum + run.durationSec, 0);
  const workoutSets = workouts.reduce(
    (sum, workout) => sum + workout.exercises.reduce((inner, ex) => inner + ex.sets.length, 0),
    0,
  );
  const mealsLogged = new Set(foods.map((food) => food.meal)).size;
  const totals = foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const { score, parts, partsMax, max } = scoreParts(
    {
      runKm,
      workoutCount: workouts.length,
      mealsLogged,
      steps,
    },
    state.profile,
  );

  return {
    date,
    runKm,
    runDurationSec,
    workoutCount: workouts.length,
    workoutSets,
    workoutMinutes: workouts.reduce((sum, workout) => sum + workout.durationMin, 0),
    workoutName: workouts[0]?.template,
    mealsLogged,
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
    steps,
    score,
    parts,
    partsMax,
    max,
  };
}

export function scoreParts(
  day: { runKm: number; workoutCount: number; mealsLogged: number; steps: number },
  profile: Profile,
) {
  const movement = clamp(day.runKm / 3);
  const training = day.workoutCount > 0 ? 1 : 0;
  const nutrition = clamp(day.mealsLogged / 3);
  const activity = clamp(day.steps / Math.max(profile.stepGoal, 1));

  const enabled = profile.priorities;
  let earned = 0;
  let max = 0;

  if (enabled.running) {
    earned += movement * WEIGHTS.running;
    max += WEIGHTS.running;
  }
  if (enabled.strength) {
    earned += training * WEIGHTS.strength;
    max += WEIGHTS.strength;
  }
  if (enabled.nutrition) {
    earned += nutrition * WEIGHTS.nutrition;
    max += WEIGHTS.nutrition;
  }
  if (enabled.steps) {
    earned += activity * WEIGHTS.steps;
    max += WEIGHTS.steps;
  }

  const score = max === 0 ? 0 : Math.round((earned / max) * 100);
  const partsMax = {
    movement: enabled.running ? WEIGHTS.running : 0,
    training: enabled.strength ? WEIGHTS.strength : 0,
    nutrition: enabled.nutrition ? WEIGHTS.nutrition : 0,
    activity: enabled.steps ? WEIGHTS.steps : 0,
  };
  return {
    score,
    max,
    parts: {
      movement: Math.round(movement * WEIGHTS.running),
      training: Math.round(training * WEIGHTS.strength),
      nutrition: Math.round(nutrition * WEIGHTS.nutrition),
      activity: Math.round(activity * WEIGHTS.steps),
    },
    partsMax,
  };
}

export function heatLevelFromScore(score: number): 0 | 1 | 2 | 3 | 4 {
  if (score <= 0) return 0;
  if (score < 26) return 1;
  if (score < 51) return 2;
  if (score < 81) return 3;
  return 4;
}

export function runHeatLevel(km: number): 0 | 1 | 2 | 3 | 4 {
  if (km <= 0) return 0;
  if (km < 3) return 1;
  if (km < 5) return 2;
  if (km < 10) return 3;
  return 4;
}

export function mealHeatLevel(meals: number): 0 | 1 | 2 | 3 | 4 {
  if (meals <= 0) return 0;
  if (meals === 1) return 2;
  if (meals === 2) return 3;
  return 4;
}

export function workoutHeatLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  return 4;
}

export function currentStreak(today: string, isActive: (date: string) => boolean): number {
  let streak = 0;
  let cursor = today;
  while (isActive(cursor) && streak < 400) {
    streak += 1;
    cursor = shiftBack(cursor);
  }
  return streak;
}

function shiftBack(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function defaultPriorities(): Priorities {
  return {
    running: true,
    strength: true,
    nutrition: true,
    steps: true,
    mobility: false,
  };
}
