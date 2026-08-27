import { useSyncExternalStore } from "react";
import { createBlankState, createDemoState } from "./demo";
import { defaultIntegrations } from "./integrations";
import { preferPersistedState, looksLikeSeededDemo } from "./persistChoice";
import { defaultPriorities } from "./scoring";
import { getFoodById, applyFoodLogPatch } from "./nutrition";
import { runSync } from "./sync";
import { fetchStravaRuns } from "./strava/activities";
import { tokenToStravaAuth, exchangeStravaCode } from "./strava/config";
import { macrosForGrams } from "./foods";
import { nowTime, todayISO, uid } from "./dates";
import { goalModeMeta } from "./goalModes";
import { idbReadState, idbWriteState } from "./idb";
import type { TrainingPlan } from "./trainingPlans";
import type {
  AppState,
  DataMode,
  FoodLog,
  GoalMode,
  IntegrationId,
  MealType,
  Profile,
  RoutePlan,
  RunLog,
  SavedMeal,
  SyncEvent,
  WorkoutLog,
  StravaAuth,
} from "./types";

export const STORAGE_KEY = "one-life-fitness-v6";

let state: AppState = load();
const listeners = new Set<() => void>();
let autoSyncTimer: number | undefined;
let mutatedSinceLoad = false;
let persistReady = false;
let bootPromise: Promise<void> | undefined;
let idbWriteQueue: Promise<void> = Promise.resolve();

function migrate(raw: Record<string, unknown>): AppState | null {
  if (!raw?.profile || !Array.isArray(raw.runs)) return null;
  const base = raw as unknown as AppState;
  const profile = base.profile as Profile;
  const weightLogs = Array.isArray(base.weightLogs) ? base.weightLogs : [];
  const sortedWeights = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date));
  const dataMode: DataMode | undefined =
    base.dataMode === "live" || base.dataMode === "demo" ? base.dataMode : undefined;
  return {
    ...base,
    profile: {
      ...profile,
      goalMode: profile.goalMode ?? "balanced",
      priorities: profile.priorities ?? defaultPriorities(),
      startWeightKg: profile.startWeightKg ?? sortedWeights[0]?.kg,
      currentWeightKg: profile.currentWeightKg ?? sortedWeights[sortedWeights.length - 1]?.kg,
      targetWeightKg: profile.targetWeightKg ?? (sortedWeights[0] ? Math.round((sortedWeights[0].kg - 4) * 10) / 10 : 74),
      restSec: typeof profile.restSec === "number" && profile.restSec > 0 ? profile.restSec : 90,
      heightCm: typeof profile.heightCm === "number" && profile.heightCm > 0 ? profile.heightCm : undefined,
    },
    integrations: Array.isArray(base.integrations) ? base.integrations : defaultIntegrations(),
    autoSync: typeof base.autoSync === "boolean" ? base.autoSync : true,
    syncLog: Array.isArray(base.syncLog) ? base.syncLog : [],
    favoriteFoodIds: Array.isArray(base.favoriteFoodIds) ? base.favoriteFoodIds : [],
    recentFoods: Array.isArray(base.recentFoods) ? base.recentFoods : [],
    savedMeals: Array.isArray(base.savedMeals) ? base.savedMeals : [],
    savedRoutes: Array.isArray(base.savedRoutes) ? base.savedRoutes : [],
    weightLogs: Array.isArray(base.weightLogs) ? base.weightLogs : [],
    strava: base.strava as StravaAuth | undefined,
    dataMode,
    savedAt: typeof base.savedAt === "string" ? base.savedAt : undefined,
    trainingPlanId: typeof base.trainingPlanId === "string" ? base.trainingPlanId : undefined,
    customPlans: Array.isArray(base.customPlans) ? base.customPlans : [],
  };
}

function load(): AppState {
  for (const key of [STORAGE_KEY, "one-life-fitness-v5", "one-life-fitness-v4", "one-life-fitness-v3", "one-life-fitness-v2", "one-life-fitness-v1"]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = migrate(JSON.parse(raw) as Record<string, unknown>);
      if (!parsed || looksLikeSeededDemo(parsed)) continue;
      if (key !== STORAGE_KEY) localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    } catch {
      /* try next key */
    }
  }
  return createBlankState();
}

function stamp(next: AppState, mode?: DataMode): AppState {
  return {
    ...next,
    dataMode: mode ?? next.dataMode ?? (looksLikeSeededDemo(next) ? "demo" : "live"),
    savedAt: new Date().toISOString(),
  };
}

function notify() {
  listeners.forEach((listener) => listener());
  ensureAutoSyncTimer();
}

function queueIdbWrite(snapshot: AppState) {
  idbWriteQueue = idbWriteQueue
    .then(() => idbWriteState(snapshot))
    .catch(() => {
      /* IndexedDB unavailable */
    });
}

function persist() {
  if (!persistReady) {
    notify();
    return;
  }
  if (!state.savedAt) {
    state = stamp(state);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Safari private mode / quota */
  }
  queueIdbWrite(state);
  notify();
}

function emit(next: AppState) {
  mutatedSinceLoad = true;
  state = stamp(next);
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

async function hydrateFromIndexedDb() {
  try {
    const raw = await idbReadState();
    if (!raw || typeof raw !== "object") return;
    const migrated = migrate(raw as Record<string, unknown>);
    if (!migrated) return;
    if (mutatedSinceLoad) return;
    const next = preferPersistedState(state, migrated);
    state = looksLikeSeededDemo(next) ? createBlankState() : next;
    notify();
  } catch {
    /* keep localStorage snapshot */
  }
}

async function hydrateAndReady() {
  try {
    await Promise.race([
      hydrateFromIndexedDb(),
      new Promise<void>((resolve) => {
        setTimeout(resolve, 3000);
      }),
    ]);
  } finally {
    persistReady = true;
    persist();
  }
  if (state.integrations.some((item) => item.connected) && !looksLikeSeededDemo(state)) {
    void syncNow(true);
  }
}

export function initStore(): Promise<void> {
  if (!bootPromise) {
    bootPromise = hydrateAndReady();
  }
  return bootPromise;
}

export function resetDemo() {
  emit(createDemoState());
}

export function startFresh() {
  emit(createBlankState());
}

export function setTrainingPlan(id: string | undefined) {
  emit({ ...state, trainingPlanId: id });
}

export function saveCustomPlan(plan: TrainingPlan) {
  const customPlans = [plan, ...(state.customPlans ?? []).filter((item) => item.id !== plan.id)];
  emit({ ...state, customPlans, trainingPlanId: plan.id });
}

export function removeCustomPlan(id: string) {
  emit({
    ...state,
    customPlans: (state.customPlans ?? []).filter((item) => item.id !== id),
    trainingPlanId: state.trainingPlanId === id ? undefined : state.trainingPlanId,
  });
}

const BACKUP_VERSION = 6;

export function exportBackup(): string {
  return JSON.stringify(
    {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      state,
    },
    null,
    2,
  );
}

export function downloadBackup() {
  const blob = new Blob([exportBackup()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `one-life-backup-${todayISO()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function importBackup(raw: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const payload =
      parsed.state && typeof parsed.state === "object"
        ? (parsed.state as Record<string, unknown>)
        : parsed;
    const migrated = migrate(payload);
    if (!migrated) return { ok: false, error: "This file is not a valid One Life backup." };
    emit(migrated);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not read the backup file." };
  }
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
  const entry = { ...run, source: run.source ?? "manual" };
  emit({
    ...state,
    runs: state.runs.some((item) => item.id === entry.id) ? state.runs : [entry, ...state.runs],
  });
}

export function addWorkout(workout: WorkoutLog) {
  emit({
    ...state,
    workouts: state.workouts.some((item) => item.id === workout.id)
      ? state.workouts
      : [workout, ...state.workouts],
  });
}

export function removeRun(id: string) {
  emit({ ...state, runs: state.runs.filter((run) => run.id !== id) });
}

export function removeWorkout(id: string) {
  emit({ ...state, workouts: state.workouts.filter((workout) => workout.id !== id) });
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
    foods: [food, ...state.foods.filter((item) => item.id !== food.id)],
    recentFoods: food.foodId ? trackRecent(food.foodId, food.grams) : state.recentFoods,
  });
}

export function updateFoodPortion(id: string, grams: number) {
  updateFoodLog(id, { grams });
}

export function updateFoodLog(
  id: string,
  patch: Partial<Pick<FoodLog, "name" | "meal" | "grams" | "calories" | "protein" | "carbs" | "fat">>,
) {
  const target = state.foods.find((food) => food.id === id);
  if (!target) return;
  const catalog = target.foodId ? getFoodById(target.foodId) : undefined;
  const next = applyFoodLogPatch(target, patch, catalog);
  if (!next) return;
  emit({
    ...state,
    foods: state.foods.map((item) => (item.id === id ? next : item)),
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

export function logSavedMeal(savedMealId: string, meal: MealType, date?: string) {
  const saved = state.savedMeals.find((item) => item.id === savedMealId);
  if (!saved) return;
  let next = state;
  for (const item of saved.items) {
    const food = getFoodById(item.foodId);
    if (!food) continue;
    const macros = macrosForGrams(food, item.grams);
    const entry: FoodLog = {
      id: uid("food"),
      date: date ?? todayISO(),
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
  if (items.length === 0) return false;
  saveSavedMeal({ name, emoji, items });
  return true;
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
  if (id === "strava" && !connected) {
    disconnectStrava();
    return;
  }

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
  if (connected) void syncNow(false);
}

export async function completeStravaOAuth(code: string) {
  const payload = await exchangeStravaCode(code);
  const auth = tokenToStravaAuth(payload);
  const now = new Date().toISOString();
  const connectedEvent: SyncEvent = {
    id: uid("sync"),
    at: now,
    source: "strava",
    kind: "info",
    message: `Connected Strava as ${auth.athleteName ?? "athlete"}.`,
  };
  emit({
    ...state,
    strava: auth,
    integrations: state.integrations.map((item) =>
      item.id === "strava"
        ? { ...item, connected: true, connectedAt: now, lastSyncAt: now }
        : item,
    ),
    syncLog: [connectedEvent, ...state.syncLog].slice(0, 40),
  });
  await syncNow(true);
}

export function disconnectStrava() {
  const now = new Date().toISOString();
  const disconnectedEvent: SyncEvent = {
    id: uid("sync"),
    at: now,
    source: "strava",
    kind: "info",
    message: "Disconnected Strava.",
  };
  emit({
    ...state,
    strava: undefined,
    integrations: state.integrations.map((item) =>
      item.id === "strava" ? { ...item, connected: false, connectedAt: undefined, lastSyncAt: undefined } : item,
    ),
    syncLog: [disconnectedEvent, ...state.syncLog].slice(0, 40),
  });
}

export function setAutoSync(enabled: boolean) {
  emit({ ...state, autoSync: enabled });
}

async function pullStrava(stateIn: AppState): Promise<AppState> {
  if (!stateIn.strava) return stateIn;

  try {
    const existing = new Set(stateIn.runs.map((run) => run.externalId).filter(Boolean) as string[]);
    const { auth, imported } = await fetchStravaRuns(stateIn.strava, existing);
    const now = new Date().toISOString();
    const events: SyncEvent[] =
      imported.length > 0
        ? imported.map((run) => ({
            id: uid("sync"),
            at: now,
            source: "strava" as const,
            kind: "run" as const,
            message: `Imported ${run.distanceKm.toFixed(1)} km · ${run.notes?.split(" · ")[0] ?? "run"}.`,
          }))
        : [];

    return {
      ...stateIn,
      strava: auth,
      runs: imported.length > 0 ? [...imported, ...stateIn.runs] : stateIn.runs,
      syncLog: [...events, ...stateIn.syncLog].slice(0, 40),
    };
  } catch (error) {
    const now = new Date().toISOString();
    const failedEvent: SyncEvent = {
      id: uid("sync"),
      at: now,
      source: "strava",
      kind: "error",
      message: error instanceof Error ? error.message : "Strava sync failed.",
    };
    return {
      ...stateIn,
      syncLog: [failedEvent, ...stateIn.syncLog].slice(0, 40),
    };
  }
}

export async function syncNow(silent = false) {
  let current = await pullStrava(state);
  const result = runSync(current);
  emit(result.state);
  return silent ? result : result;
}

export function saveRoute(route: RoutePlan) {
  emit({
    ...state,
    savedRoutes: [route, ...state.savedRoutes.filter((item) => item.id !== route.id)],
  });
}

export function removeRoute(id: string) {
  emit({ ...state, savedRoutes: state.savedRoutes.filter((route) => route.id !== id) });
}

export function logWeight(date: string, kg: number) {
  if (!Number.isFinite(kg) || kg <= 0) return;
  const rounded = Math.round(kg * 100) / 100;
  const existing = state.weightLogs.find((entry) => entry.date === date);
  const weightLogs = existing
    ? state.weightLogs.map((entry) => (entry.date === date ? { ...entry, kg: rounded } : entry))
    : [...state.weightLogs, { date, kg: rounded }].sort((a, b) => a.date.localeCompare(b.date));
  const start = state.profile.startWeightKg ?? weightLogs[0]?.kg ?? rounded;
  emit({
    ...state,
    weightLogs,
    profile: {
      ...state.profile,
      currentWeightKg: rounded,
      startWeightKg: start,
    },
  });
}

export function logQuickFood(input: {
  name: string;
  meal: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date?: string;
}) {
  const name = input.name.trim();
  const calories = Math.round(input.calories);
  const protein = Math.round(input.protein * 10) / 10;
  const carbs = Math.round(input.carbs * 10) / 10;
  const fat = Math.round(input.fat * 10) / 10;
  if (!name) return;
  if (![calories, protein, carbs, fat].every((n) => Number.isFinite(n) && n >= 0)) return;
  const entry: FoodLog = {
    id: uid("food"),
    date: input.date ?? todayISO(),
    time: nowTime(),
    meal: input.meal,
    name,
    grams: 1,
    calories,
    protein,
    carbs,
    fat,
  };
  emit({ ...state, foods: [entry, ...state.foods] });
}
