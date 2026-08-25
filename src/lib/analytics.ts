import { addDays, formatShortDate, toISODate, todayISO } from "./dates";
import type { AppState, RunLog, WorkoutLog } from "./types";

export type WeekBucket = { label: string; value: number };

export type RunPR = { label: string; value: string; date?: string };

const MUSCLE_MAP: Record<string, string> = {
  "Dumbbell Bench Press": "Chest",
  "Barbell Bench Press": "Chest",
  "Incline Dumbbell Press": "Chest",
  "Cable Fly": "Chest",
  "One Arm Dumbbell Row": "Back",
  "Barbell Row": "Back",
  "Lat Pulldown": "Back",
  "Pull-up": "Back",
  "Deadlift": "Back",
  "Overhead Press": "Shoulders",
  "Lateral Raise": "Shoulders",
  "Face Pull": "Shoulders",
  "Dumbbell Curl": "Arms",
  "Hammer Curl": "Arms",
  "Tricep Pushdown": "Arms",
  "Skull Crusher": "Arms",
  "Back Squat": "Legs",
  "Bodyweight Squat": "Legs",
  "Romanian Deadlift": "Legs",
  "Walking Lunge": "Legs",
  "Leg Press": "Legs",
  "Calf Raise": "Legs",
  "Push-up": "Chest",
  "Dip": "Arms",
  "Plank": "Core",
};

function formatPaceSec(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.round(totalSec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function weekStart(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toISODate(date);
}

export function weeklyRunKm(runs: RunLog[], weeks = 8): WeekBucket[] {
  const today = todayISO();
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const end = addDays(today, -i * 7);
    const start = addDays(end, -6);
    const km = runs
      .filter((run) => run.date >= start && run.date <= end)
      .reduce((sum, run) => sum + run.distanceKm, 0);
    buckets.push({
      label: formatShortDate(end).replace(",", ""),
      value: Math.round(km * 10) / 10,
    });
  }
  return buckets;
}

export function paceTrend(runs: RunLog[], limit = 10): { label: string; paceSec: number }[] {
  return [...runs]
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
    .slice(0, limit)
    .reverse()
    .map((run) => ({
      label: formatShortDate(run.date),
      paceSec: run.distanceKm > 0 ? run.durationSec / run.distanceKm : 0,
    }))
    .filter((item) => item.paceSec > 0);
}

export function runPersonalRecords(runs: RunLog[]): RunPR[] {
  if (runs.length === 0) {
    return [
      { label: "Longest run", value: "—" },
      { label: "Best 5K", value: "—" },
      { label: "Best 10K", value: "—" },
      { label: "Fastest pace", value: "—" },
    ];
  }
  const longest = runs.reduce((best, run) => (run.distanceKm > best.distanceKm ? run : best), runs[0]);
  const best5 = bestTimeAtDistance(runs, 5);
  const best10 = bestTimeAtDistance(runs, 10);
  const fastestPace = runs.reduce((best, run) => {
    const pace = run.durationSec / run.distanceKm;
    return pace < best.pace ? { pace, run } : best;
  }, { pace: Infinity, run: runs[0] });

  return [
    { label: "Longest run", value: `${longest.distanceKm.toFixed(1)} km`, date: longest.date },
    { label: "Best 5K", value: best5 ? formatDuration(best5.time) : "—", date: best5?.date },
    { label: "Best 10K", value: best10 ? formatDuration(best10.time) : "—", date: best10?.date },
    {
      label: "Fastest pace",
      value: fastestPace.pace < Infinity ? formatPaceSec(fastestPace.pace) : "—",
      date: fastestPace.run.date,
    },
  ];
}

function bestTimeAtDistance(runs: RunLog[], targetKm: number) {
  const eligible = runs.filter((run) => run.distanceKm >= targetKm - 0.05);
  if (eligible.length === 0) return null;
  let best = eligible[0];
  let bestTime = best.durationSec * (targetKm / best.distanceKm);
  for (const run of eligible.slice(1)) {
    const projected = run.durationSec * (targetKm / run.distanceKm);
    if (projected < bestTime) {
      bestTime = projected;
      best = run;
    }
  }
  return { time: bestTime, date: best.date };
}

export function trainingLoad(runs: RunLog[]) {
  const today = todayISO();
  const thisWeek = runs.filter((run) => run.date >= addDays(today, -6)).reduce((s, r) => s + r.distanceKm, 0);
  const lastWeek = runs
    .filter((run) => run.date >= addDays(today, -13) && run.date <= addDays(today, -7))
    .reduce((s, r) => s + r.distanceKm, 0);
  const delta = lastWeek === 0 ? 0 : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  let status = "Balanced";
  if (delta > 15) status = "Building";
  if (delta > 35) status = "High load";
  if (delta < -15) status = "Recovery";
  return { thisWeek: Math.round(thisWeek * 10) / 10, lastWeek: Math.round(lastWeek * 10) / 10, delta, status };
}

export function racePrediction(runs: RunLog[]): { distance: string; time: string }[] {
  const ref = bestTimeAtDistance(runs, 5);
  if (!ref) return [];
  const t5 = ref.time;
  const predict = (fromKm: number, toKm: number, fromTime: number) => {
    const predicted = fromTime * Math.pow(toKm / fromKm, 1.06);
    return formatDuration(predicted);
  };
  return [
    { distance: "10K", time: predict(5, 10, t5) },
    { distance: "Half marathon", time: predict(5, 21.1, t5) },
    { distance: "Marathon", time: predict(5, 42.195, t5) },
  ];
}

export function weeklyWorkoutVolume(workouts: WorkoutLog[], weeks = 8): WeekBucket[] {
  const today = todayISO();
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const end = addDays(today, -i * 7);
    const start = addDays(end, -6);
    const volume = workouts
      .filter((w) => w.date >= start && w.date <= end)
      .reduce((sum, w) => {
        return (
          sum +
          w.exercises.reduce(
            (inner, ex) => inner + ex.sets.reduce((setSum, set) => setSum + set.kg * set.reps, 0),
            0,
          )
        );
      }, 0);
    buckets.push({ label: formatShortDate(end).replace(",", ""), value: Math.round(volume) });
  }
  return buckets;
}

export function exercisePersonalRecords(workouts: WorkoutLog[], limit = 6) {
  const map = new Map<string, { kg: number; reps: number; date: string }>();
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        const current = map.get(exercise.name);
        if (!current || set.kg > current.kg || (set.kg === current.kg && set.reps > current.reps)) {
          map.set(exercise.name, { kg: set.kg, reps: set.reps, date: workout.date });
        }
      }
    }
  }
  return [...map.entries()]
    .sort((a, b) => b[1].kg - a[1].kg)
    .slice(0, limit)
    .map(([name, pr]) => ({ name, ...pr }));
}

export function muscleGroupFrequency(workouts: WorkoutLog[]) {
  const counts = new Map<string, number>();
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      const group = MUSCLE_MAP[exercise.name] ?? "Other";
      counts.set(group, (counts.get(group) ?? 0) + exercise.sets.length);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([group, sets]) => ({ group, sets }));
}

export function strengthProgression(workouts: WorkoutLog[], exerciseName: string, weeks = 8): WeekBucket[] {
  const today = todayISO();
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const end = addDays(today, -i * 7);
    const start = addDays(end, -6);
    let maxKg = 0;
    for (const workout of workouts.filter((w) => w.date >= start && w.date <= end)) {
      for (const exercise of workout.exercises) {
        if (exercise.name !== exerciseName) continue;
        for (const set of exercise.sets) {
          maxKg = Math.max(maxKg, set.kg);
        }
      }
    }
    buckets.push({ label: formatShortDate(end).replace(",", ""), value: maxKg });
  }
  return buckets;
}

export function topLiftExercise(workouts: WorkoutLog[]): string {
  const counts = new Map<string, number>();
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      counts.set(exercise.name, (counts.get(exercise.name) ?? 0) + exercise.sets.length);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Dumbbell Bench Press";
}

export function nutritionWeeklyAverages(state: AppState, weeks = 4) {
  const today = todayISO();
  const buckets: {
    label: string;
    calories: number;
    protein: number;
    proteinHit: boolean;
    calorieHit: boolean;
  }[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const end = addDays(today, -i * 7);
    const start = addDays(end, -6);
    const days = Array.from({ length: 7 }, (_, idx) => addDays(start, idx));
    let calSum = 0;
    let proSum = 0;
    let proteinDays = 0;
    let calorieDays = 0;
    for (const day of days) {
      const foods = state.foods.filter((f) => f.date === day);
      const cal = foods.reduce((s, f) => s + f.calories, 0);
      const pro = foods.reduce((s, f) => s + f.protein, 0);
      if (foods.length > 0) {
        calSum += cal;
        proSum += pro;
        if (pro >= state.profile.proteinGoal * 0.9) proteinDays += 1;
        if (cal >= state.profile.calorieGoal * 0.85 && cal <= state.profile.calorieGoal * 1.15) calorieDays += 1;
      }
    }
    buckets.push({
      label: `W${weeks - i}`,
      calories: Math.round(calSum / 7),
      protein: Math.round(proSum / 7),
      proteinHit: proteinDays >= 5,
      calorieHit: calorieDays >= 4,
    });
  }
  return buckets;
}

export function macroAdherence(state: AppState, days = 30) {
  const today = todayISO();
  let proteinHits = 0;
  let calorieHits = 0;
  let logged = 0;
  for (let i = 0; i < days; i += 1) {
    const day = addDays(today, -i);
    const foods = state.foods.filter((f) => f.date === day);
    if (foods.length === 0) continue;
    logged += 1;
    const cal = foods.reduce((s, f) => s + f.calories, 0);
    const pro = foods.reduce((s, f) => s + f.protein, 0);
    if (pro >= state.profile.proteinGoal * 0.9) proteinHits += 1;
    if (cal >= state.profile.calorieGoal * 0.85 && cal <= state.profile.calorieGoal * 1.15) calorieHits += 1;
  }
  return {
    daysLogged: logged,
    proteinRate: logged ? Math.round((proteinHits / logged) * 100) : 0,
    calorieRate: logged ? Math.round((calorieHits / logged) * 100) : 0,
  };
}

export function weightTrend(weights: { date: string; kg: number }[], limit = 12): WeekBucket[] {
  if (weights.length === 0) return [];
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const byWeek = new Map<string, number[]>();
  for (const entry of sorted) {
    const key = weekStart(entry.date);
    const list = byWeek.get(key) ?? [];
    list.push(entry.kg);
    byWeek.set(key, list);
  }
  return [...byWeek.entries()]
    .slice(-limit)
    .map(([week, values]) => ({
      label: formatShortDate(addDays(week, 3)).replace(",", ""),
      value: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
    }));
}

export function weightChange(weights: { date: string; kg: number }[]) {
  if (weights.length < 2) return null;
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0].kg;
  const last = sorted[sorted.length - 1].kg;
  return { current: last, change: Math.round((last - first) * 10) / 10, weeks: Math.ceil(sorted.length / 7) };
}
