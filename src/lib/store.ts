import { useSyncExternalStore } from "react";
import { createDemoState } from "./demo";
import { defaultIntegrations } from "./integrations";
import { runSync } from "./sync";
import type { AppState, FoodLog, IntegrationId, Profile, RunLog, WorkoutLog } from "./types";

const KEY = "one-life-fitness-v2";

let state: AppState = load();
const listeners = new Set<() => void>();
let autoSyncTimer: number | undefined;

function migrate(raw: Record<string, unknown>): AppState | null {
  if (!raw?.profile || !Array.isArray(raw.runs)) return null;
  const base = raw as unknown as AppState;
  return {
    ...base,
    integrations: Array.isArray(base.integrations) ? base.integrations : defaultIntegrations(),
    autoSync: typeof base.autoSync === "boolean" ? base.autoSync : true,
    syncLog: Array.isArray(base.syncLog) ? base.syncLog : [],
  };
}

function load(): AppState {
  for (const key of [KEY, "one-life-fitness-v1"]) {
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

export function addFood(food: FoodLog) {
  emit({ ...state, foods: [food, ...state.foods] });
}

export function removeFood(id: string) {
  emit({ ...state, foods: state.foods.filter((food) => food.id !== id) });
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
