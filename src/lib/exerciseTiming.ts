const TIMED_NAME =
  /\b(plank|side plank|wall[- ]?sit|dead hang|dead-hang|hollow(?: body)?(?: hold)?|superman hold|static hold|isometric|glute bridge hold)\b/i;

export type LiftUnit = "reps" | "time";

export function parseTimedTarget(targetReps?: string): number | null {
  if (!targetReps) return null;
  const match = targetReps.trim().match(/^(\d+(?:\.\d+)?)\s*s$/i);
  if (!match) return null;
  const seconds = Number(match[1]);
  return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : null;
}

export function isTimedExercise(name: string, targetReps?: string): boolean {
  if (parseTimedTarget(targetReps) != null) return true;
  return TIMED_NAME.test(name);
}

/** Unit from the saved string only — Farmer Carry "60" stays reps until the user picks Time. */
export function liftTargetNumber(target?: string, fallback = 10): number {
  const timed = parseTimedTarget(target);
  if (timed != null) return timed;
  const n = Number.parseInt((target ?? "").trim(), 10);
  if (Number.isFinite(n) && n > 0) return Math.round(n);
  return fallback;
}

export function parseLiftQuantity(target?: string): { unit: LiftUnit; value: number } {
  const timed = parseTimedTarget(target);
  if (timed != null) return { unit: "time", value: timed };
  return { unit: "reps", value: liftTargetNumber(target, 10) };
}

export function formatLiftTarget(unit: LiftUnit, value: number | string): string {
  const n = typeof value === "string" ? Number.parseInt(value.trim(), 10) : value;
  const safe = Number.isFinite(n) && n > 0 ? Math.round(n) : unit === "time" ? 45 : 10;
  return unit === "time" ? `${safe}s` : String(safe);
}

export function exerciseLogUnit(exercise: {
  name: string;
  targetReps?: string;
  targetUnit?: LiftUnit;
}): LiftUnit {
  if (exercise.targetUnit === "reps" || exercise.targetUnit === "time") return exercise.targetUnit;
  return isTimedExercise(exercise.name, exercise.targetReps) ? "time" : "reps";
}

export function formatWorkoutSet(set: { kg: number; reps: number; durationSec?: number }): string {
  if (set.durationSec && set.durationSec > 0) return `${set.durationSec}s`;
  return `${set.kg}kg × ${set.reps}`;
}

export function sessionHasLoggedSets(exercises: { sets: unknown[] }[]): boolean {
  return exercises.some((exercise) => exercise.sets.length > 0);
}

export const REP_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30];
export const HOLD_SEC_CHOICES = [10, 15, 20, 30, 45, 60, 75, 90, 120, 150, 180];

/** Keep the current/prescription value in the picker even if it is not a preset. */
export function mergeLiftChoice(choices: readonly number[], extra?: number | null): number[] {
  if (extra == null || !Number.isFinite(extra) || extra <= 0) return [...choices];
  const n = Math.round(extra);
  if (choices.includes(n)) return [...choices];
  return [...choices, n].sort((a, b) => a - b);
}
