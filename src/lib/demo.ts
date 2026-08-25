import { addDays, todayISO, uid } from "./dates";
import { macrosForGrams, FOODS } from "./foods";
import { defaultIntegrations } from "./integrations";
import { defaultPriorities } from "./scoring";
import type { AppState, FoodLog, RunLog, StepLog, WorkoutLog } from "./types";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function foodById(id: string) {
  const food = FOODS.find((item) => item.id === id);
  if (!food) throw new Error(`Missing food ${id}`);
  return food;
}

function logFood(date: string, time: string, meal: FoodLog["meal"], foodId: string, grams: number): FoodLog {
  const food = foodById(foodId);
  const macros = macrosForGrams(food, grams);
  return {
    id: uid("food"),
    date,
    time,
    meal,
    name: food.name,
    grams,
    ...macros,
  };
}

export function createDemoState(today = todayISO()): AppState {
  const rng = mulberry32(20260824);
  const runs: RunLog[] = [];
  const workouts: WorkoutLog[] = [];
  const foods: FoodLog[] = [];
  const steps: StepLog[] = [];

  for (let i = 119; i >= 1; i -= 1) {
    const date = addDays(today, -i);
    const dow = new Date(`${date}T12:00:00`).getDay();
    const skip = rng() < 0.12;
    steps.push({
      date,
      steps: skip ? Math.round(2800 + rng() * 1800) : Math.round(6200 + rng() * 5200),
    });

    if (!skip && (dow === 1 || dow === 3 || dow === 6 || rng() < 0.12)) {
      const distanceKm = Math.round((3 + rng() * 7) * 10) / 10;
      const paceSec = 350 + rng() * 80;
      const durationSec = Math.round(distanceKm * paceSec);
      runs.push({
        id: uid("run"),
        date,
        time: pick(rng, ["05:50", "06:15", "06:40", "17:30"]),
        distanceKm,
        durationSec,
        calories: Math.round(distanceKm * 62),
      });
    }

    if (!skip && (dow === 2 || dow === 4 || dow === 5 || dow === 0 || rng() < 0.1)) {
      const templates = [
        { name: "Upper Body", exercises: ["Dumbbell Bench Press", "One Arm Dumbbell Row", "Overhead Press", "Lat Pulldown"] },
        { name: "Lower Body", exercises: ["Back Squat", "Romanian Deadlift", "Walking Lunge"] },
        { name: "Push", exercises: ["Barbell Bench Press", "Incline Dumbbell Press", "Overhead Press"] },
        { name: "Pull", exercises: ["Deadlift", "Barbell Row", "Lat Pulldown"] },
        { name: "Calisthenics", exercises: ["Pull-up", "Push-up", "Dip", "Bodyweight Squat"] },
      ];
      const template = pick(rng, templates);
      workouts.push({
        id: uid("wo"),
        date,
        time: pick(rng, ["09:30", "10:00", "18:15", "19:00"]),
        template: template.name,
        durationMin: 38 + Math.round(rng() * 22),
        exercises: template.exercises.map((name) => ({
          name,
          sets: [0, 1, 2].map(() => ({
            kg: 12 + Math.round(rng() * 28),
            reps: 8 + Math.round(rng() * 6),
          })),
        })),
      });
    }

    if (!skip) {
      foods.push(logFood(date, "07:20", "breakfast", pick(rng, ["egg", "oats", "garlic-rice", "tocino"]), 120 + Math.round(rng() * 80)));
      foods.push(logFood(date, "12:30", "lunch", "rice", 180 + Math.round(rng() * 80)));
      foods.push(logFood(date, "12:32", "lunch", pick(rng, ["adobo", "chicken-breast", "tinola", "bangus"]), 140 + Math.round(rng() * 80)));
      if (rng() > 0.35) {
        foods.push(logFood(date, "19:10", "dinner", pick(rng, ["sinigang", "bicol", "sisig", "tilapia"]), 160 + Math.round(rng() * 90)));
        foods.push(logFood(date, "19:12", "dinner", "rice", 150));
      }
      if (rng() > 0.7) {
        foods.push(logFood(date, "16:00", "snacks", pick(rng, ["kwek", "banana", "protein-shake", "shanghai"]), 80 + Math.round(rng() * 70)));
      }
    } else if (rng() > 0.5) {
      foods.push(logFood(date, "13:00", "lunch", pick(rng, ["jollibee-chickenjoy", "mcdo-burger", "7e-siopao"]), 150));
    }
  }

  steps.push({ date: today, steps: 8421 });
  runs.push({
    id: uid("run"),
    date: today,
    time: "06:30",
    distanceKm: 5.2,
    durationSec: 32 * 60 + 41,
    calories: 318,
    notes: "Easy aerobic. Felt smooth after km 2.",
    source: "apple-health",
  });
  workouts.push({
    id: uid("wo"),
    date: today,
    time: "10:00",
    template: "Upper Body",
    durationMin: 42,
    exercises: [
      {
        name: "Dumbbell Bench Press",
        sets: [
          { kg: 20, reps: 10 },
          { kg: 20, reps: 10 },
          { kg: 20, reps: 8 },
        ],
      },
      {
        name: "One Arm Dumbbell Row",
        sets: [
          { kg: 20, reps: 12 },
          { kg: 20, reps: 12 },
          { kg: 20, reps: 10 },
        ],
      },
      {
        name: "Overhead Press",
        sets: [
          { kg: 16, reps: 10 },
          { kg: 16, reps: 8 },
          { kg: 14, reps: 8 },
        ],
      },
      {
        name: "Lat Pulldown",
        sets: [
          { kg: 40, reps: 12 },
          { kg: 45, reps: 10 },
          { kg: 45, reps: 9 },
        ],
      },
    ],
  });
  foods.push(
    logFood(today, "07:10", "breakfast", "egg", 100),
    logFood(today, "07:10", "breakfast", "garlic-rice", 150),
    logFood(today, "12:30", "lunch", "rice", 200),
    logFood(today, "12:30", "lunch", "chicken-breast", 150),
    logFood(today, "12:30", "lunch", "egg", 100),
  );

  const twoDaysAgo = addDays(today, -2);
  if (!runs.some((run) => run.date === twoDaysAgo)) {
    runs.push({
      id: uid("run"),
      date: twoDaysAgo,
      time: "06:20",
      distanceKm: 3.2,
      durationSec: 21 * 60 + 10,
      calories: 198,
    });
  }

  return {
    profile: {
      name: "Jack",
      calorieGoal: 1900,
      proteinGoal: 140,
      carbGoal: 220,
      fatGoal: 60,
      stepGoal: 10000,
      priorities: defaultPriorities(),
    },
    runs,
    workouts,
    foods,
    steps,
    integrations: defaultIntegrations(),
    autoSync: true,
    syncLog: [
      {
        id: uid("sync"),
        at: new Date().toISOString(),
        source: "apple-health",
        kind: "steps",
        message: "Synced 8,421 steps from Apple Health.",
      },
    ],
  };
}
