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
