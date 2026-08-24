import { useSyncExternalStore } from "react";
import { createDemoState } from "./demo";
import type { AppState, FoodLog, Profile, RunLog, StepLog, WorkoutLog } from "./types";

const KEY = "one-life-fitness-v1";

let state: AppState = load();
const listeners = new Set<() => void>();

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed?.profile && Array.isArray(parsed.runs)) return parsed;
    }
  } catch {
    /* fresh start */
  }
  return createDemoState();
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((listener) => listener());
}

function emit(next: AppState) {
  state = next;
  persist();
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
  emit({ ...state, runs: [run, ...state.runs] });
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
  const nextSteps: StepLog[] = existing
    ? state.steps.map((entry) => (entry.date === date ? { ...entry, steps } : entry))
    : [{ date, steps }, ...state.steps];
  emit({ ...state, steps: nextSteps });
}

export function bumpSteps(date: string, amount: number) {
  const current = state.steps.find((entry) => entry.date === date)?.steps ?? 0;
  setSteps(date, Math.max(0, current + amount));
}
