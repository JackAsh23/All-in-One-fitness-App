import { describe, expect, it } from "vitest";
import {
  exerciseLogUnit,
  formatLiftTarget,
  formatWorkoutSet,
  isTimedExercise,
  liftTargetNumber,
  mergeLiftChoice,
  parseLiftQuantity,
  parseTimedTarget,
  sessionHasLoggedSets,
  HOLD_SEC_CHOICES,
  REP_CHOICES,
} from "./exerciseTiming";

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

  it("lets the plan store Farmer Carry 60 as reps until Time is chosen", () => {
    expect(parseLiftQuantity("60")).toEqual({ unit: "reps", value: 60 });
    expect(parseLiftQuantity("60s")).toEqual({ unit: "time", value: 60 });
    expect(parseLiftQuantity("45s")).toEqual({ unit: "time", value: 45 });
    expect(formatLiftTarget("time", 60)).toBe("60s");
    expect(formatLiftTarget("reps", 60)).toBe("60");
    expect(isTimedExercise("Farmer Carry", "60")).toBe(false);
    expect(isTimedExercise("Farmer Carry", "60s")).toBe(true);
    expect(exerciseLogUnit({ name: "Farmer Carry", targetReps: "60" })).toBe("reps");
    expect(exerciseLogUnit({ name: "Farmer Carry", targetReps: "60", targetUnit: "time" })).toBe("time");
    expect(exerciseLogUnit({ name: "Plank", targetReps: "45s" })).toBe("time");
    expect(exerciseLogUnit({ name: "Plank", targetReps: "45", targetUnit: "reps" })).toBe("reps");
    expect(liftTargetNumber("60s", 45)).toBe(60);
    expect(liftTargetNumber("60", 45)).toBe(60);
    expect(liftTargetNumber(undefined, 45)).toBe(45);
    expect(liftTargetNumber(undefined, 10)).toBe(10);
  });

  it("keeps an unusual prescription in the lift dropdown", () => {
    expect(mergeLiftChoice(REP_CHOICES, 10)).toEqual([...REP_CHOICES]);
    expect(mergeLiftChoice(REP_CHOICES, 11)).toContain(11);
    expect(mergeLiftChoice(HOLD_SEC_CHOICES, 45)).toEqual([...HOLD_SEC_CHOICES]);
    expect(mergeLiftChoice(HOLD_SEC_CHOICES, 40)[0]).toBe(10);
    expect(mergeLiftChoice(HOLD_SEC_CHOICES, 40)).toContain(40);
  });
});
