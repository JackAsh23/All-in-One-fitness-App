import { describe, expect, it } from "vitest";
import { formatWorkoutSet, isTimedExercise, parseTimedTarget, sessionHasLoggedSets } from "./exerciseTiming";

describe("exerciseTiming", () => {
  it("treats plank and 45s prescriptions as timed holds", () => {
    expect(isTimedExercise("Plank")).toBe(true);
    expect(isTimedExercise("Side Plank")).toBe(true);
    expect(isTimedExercise("Wall Sit")).toBe(true);
    expect(isTimedExercise("Dumbbell Bench Press")).toBe(false);
    expect(isTimedExercise("Hold", "45s")).toBe(true);
    expect(parseTimedTarget("45s")).toBe(45);
    expect(parseTimedTarget("8")).toBeNull();
  });

  it("formats timed sets as seconds instead of kg × reps", () => {
    expect(formatWorkoutSet({ kg: 0, reps: 45, durationSec: 45 })).toBe("45s");
    expect(formatWorkoutSet({ kg: 20, reps: 10 })).toBe("20kg × 10");
  });

  it("does not count an empty finish as work", () => {
    expect(sessionHasLoggedSets([{ sets: [] }, { sets: [] }])).toBe(false);
    expect(sessionHasLoggedSets([{ sets: [{ kg: 20, reps: 8 }] }])).toBe(true);
  });
});
