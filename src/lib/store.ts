import { useSyncExternalStore } from "react";
import { createDemoState } from "./demo";
import { defaultIntegrations } from "./integrations";
import { defaultPriorities } from "./scoring";
import { getFoodById } from "./nutrition";
import { runSync } from "./sync";
import { macrosForGrams } from "./foods";
import { nowTime, todayISO, uid } from "./dates";
import { goalModeMeta } from "./goalModes";
import type {
  AppState,
  FoodLog,
  GoalMode,
  IntegrationId,
  MealType,
  Profile,
  RunLog,
  SavedMeal,
  WorkoutLog,
} from "./types";

const KEY = "one-life-fitness-v5";

let state: AppState = load();
const listeners = new Set<() => void>();
let autoSyncTimer: number | undefined;

function migrate(raw: Record<string, unknown>): AppState | null {
  if (!raw?.profile || !Array.isArray(raw.runs)) return null;
  const base = raw as unknown as AppState;
  const profile = base.profile as Profile;
  return {
    ...base,
    profile: {
      ...profile,
      goalMode: profile.goalMode ?? "balanced",
      priorities: profile.priorities ?? defaultPriorities(),
    },
    integrations: Array.isArray(base.integrations) ? base.integrations : defaultIntegrations(),
    autoSync: typeof base.autoSync === "boolean" ? base.autoSync : true,
    syncLog: Array.isArray(base.syncLog) ? base.syncLog : [],
    favoriteFoodIds: Array.isArray(base.favoriteFoodIds) ? base.favoriteFoodIds : [],
    recentFoods: Array.isArray(base.recentFoods) ? base.recentFoods : [],
    savedMeals: Array.isArray(base.savedMeals) ? base.savedMeals : [],
    weightLogs: Array.isArray(base.weightLogs) ? base.weightLogs : [],
  };
}

function load(): AppState {
  for (const key of [KEY, "one-life-fitness-v4", "one-life-fitness-v3", "one-life-fitness-v2", "one-life-fitness-v1"]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = migrate(JSON.parse(raw) as Record<string, unknown>);
      if (parsed) {
        if (key !== KEY) localStorage.setItem(KEY, JSON.stringify(parsed));
        return parsed;
      }
    } catch {
      /* try next key */
    }
  }
  return createDemoState();
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((listener) => listener());
  ensureAutoSyncTimer();
}

function emit(next: AppState) {
  state = next;
  persist();
}

function trackRecent(foodId: string, grams: number) {
  const at = new Date().toISOString();
  const recent = [{ foodId, grams, at }, ...state.recentFoods.filter((entry) => entry.foodId !== foodId)].slice(0, 24);
  return recent;
}

function ensureAutoSyncTimer() {
  if (autoSyncTimer) window.clearInterval(autoSyncTimer);
  autoSyncTimer = undefined;
  const hasConnected = state.integrations.some((item) => item.connected);
  if (state.autoSync && hasConnected) {
    autoSyncTimer = window.setInterval(() => syncNow(true), 90_000);
  }
}

export function getState() {
  return state;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function initStore() {
  ensureAutoSyncTimer();
  if (state.integrations.some((item) => item.connected)) {
    syncNow(true);
  }
}

export function resetDemo() {
  emit(createDemoState());
}

export function setGoalMode(mode: GoalMode) {
  const meta = goalModeMeta(mode);
  updateProfile({ goalMode: mode, priorities: meta.priorities });
}

export function updateProfile(patch: Partial<Profile>) {
  emit({
    ...state,
    profile: { ...state.profile, ...patch, priorities: patch.priorities ?? state.profile.priorities },
  });
}

export function addRun(run: RunLog) {
  emit({ ...state, runs: [{ ...run, source: run.source ?? "manual" }, ...state.runs] });
}

export function addWorkout(workout: WorkoutLog) {
  emit({ ...state, workouts: [workout, ...state.workouts] });
}

export function logFoodItem(input: {
  foodId: string;
  grams: number;
  meal: MealType;
  date?: string;
}) {
  const food = getFoodById(input.foodId);
  if (!food) return;
  const macros = macrosForGrams(food, input.grams);
  const entry: FoodLog = {
    id: uid("food"),
    date: input.date ?? todayISO(),
    time: nowTime(),
    meal: input.meal,
    name: food.name,
    foodId: food.id,
    grams: input.grams,
    ...macros,
  };
  emit({
    ...state,
    foods: [entry, ...state.foods],
    recentFoods: trackRecent(food.id, input.grams),
  });
}

export function addFood(food: FoodLog) {
  emit({
    ...state,
    foods: [food, ...state.foods],
    recentFoods: food.foodId ? trackRecent(food.foodId, food.grams) : state.recentFoods,
  });
}

export function updateFoodPortion(id: string, grams: number) {
  const target = state.foods.find((food) => food.id === id);
  if (!target) return;
  const food = target.foodId ? getFoodById(target.foodId) : undefined;
  const macros = food
    ? macrosForGrams(food, grams)
    : {
        calories: Math.round((target.calories / target.grams) * grams),
        protein: Math.round((target.protein / target.grams) * grams * 10) / 10,
        carbs: Math.round((target.carbs / target.grams) * grams * 10) / 10,
        fat: Math.round((target.fat / target.grams) * grams * 10) / 10,
      };
  emit({
    ...state,
    foods: state.foods.map((item) =>
      item.id === id ? { ...item, grams, ...macros } : item,
    ),
  });
}

export function removeFood(id: string) {
  emit({ ...state, foods: state.foods.filter((food) => food.id !== id) });
}

export function toggleFavoriteFood(foodId: string) {
  const exists = state.favoriteFoodIds.includes(foodId);
  emit({
    ...state,
    favoriteFoodIds: exists
      ? state.favoriteFoodIds.filter((id) => id !== foodId)
      : [foodId, ...state.favoriteFoodIds],
  });
}

export function saveSavedMeal(meal: Omit<SavedMeal, "id">) {
  emit({
    ...state,
    savedMeals: [{ ...meal, id: uid("meal") }, ...state.savedMeals],
  });
}

export function removeSavedMeal(id: string) {
  emit({ ...state, savedMeals: state.savedMeals.filter((meal) => meal.id !== id) });
}

export function logSavedMeal(savedMealId: string, meal: MealType) {
  const saved = state.savedMeals.find((item) => item.id === savedMealId);
  if (!saved) return;
  let next = state;
  for (const item of saved.items) {
    const food = getFoodById(item.foodId);
    if (!food) continue;
    const macros = macrosForGrams(food, item.grams);
    const entry: FoodLog = {
      id: uid("food"),
      date: todayISO(),
      time: nowTime(),
      meal,
      name: food.name,
      foodId: food.id,
      grams: item.grams,
      ...macros,
    };
    next = {
      ...next,
      foods: [entry, ...next.foods],
      recentFoods: trackRecent(food.id, item.grams),
    };
  }
  emit(next);
}

export function saveMealFromToday(mealType: MealType, name: string, emoji: string) {
  const today = todayISO();
  const items = state.foods
    .filter((food) => food.date === today && food.meal === mealType && food.foodId)
    .map((food) => ({ foodId: food.foodId!, grams: food.grams }));
  if (items.length === 0) return;
  saveSavedMeal({ name, emoji, items });
}

export function setSteps(date: string, steps: number) {
  const existing = state.steps.find((entry) => entry.date === date);
  const nextSteps = existing
    ? state.steps.map((entry) => (entry.date === date ? { ...entry, steps } : entry))
    : [{ date, steps }, ...state.steps];
  emit({ ...state, steps: nextSteps });
}

export function bumpSteps(date: string, amount: number) {
  const current = state.steps.find((entry) => entry.date === date)?.steps ?? 0;
  setSteps(date, Math.max(0, current + amount));
}

export function setIntegrationConnected(id: IntegrationId, connected: boolean) {
  const now = new Date().toISOString();
  emit({
    ...state,
    integrations: state.integrations.map((item) =>
      item.id === id
        ? {
            ...item,
            connected,
            connectedAt: connected ? now : undefined,
            lastSyncAt: connected ? now : undefined,
          }
        : item,
    ),
    syncLog: connected
      ? [
          {
            id: `sync_${Date.now()}`,
            at: now,
            source: id,
            kind: "info" as const,
            message: `Connected ${id.replace("-", " ")}.`,
          },
          ...state.syncLog,
        ].slice(0, 40)
      : state.syncLog,
  });
  if (connected) syncNow(false);
}

export function setAutoSync(enabled: boolean) {
  emit({ ...state, autoSync: enabled });
}

export function syncNow(silent = false) {
  const result = runSync(state);
  emit(result.state);
  return silent ? result : result;
}
