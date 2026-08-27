const TIMED_NAME =
  /\b(plank|side plank|wall[- ]?sit|dead hang|dead-hang|hollow(?: body)?(?: hold)?|superman hold|static hold|isometric|glute bridge hold)\b/i;

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
