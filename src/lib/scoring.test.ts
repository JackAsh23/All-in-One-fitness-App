import { describe, expect, it } from "vitest";
import { defaultPriorities } from "./scoring";
import {
  heatLevelFromScore,
  mealHeatLevel,
  priorityWeights,
  runHeatLevel,
  scoreParts,
  workoutHeatLevel,
} from "./scoring";
import type { Profile } from "./types";

const baseProfile: Profile = {
  name: "Test",
  calorieGoal: 1900,
  proteinGoal: 140,
  carbGoal: 220,
  fatGoal: 60,
  stepGoal: 10000,
  goalMode: "balanced",
  priorities: defaultPriorities(),
};

describe("scoring", () => {
  it("priorityWeights respects enabled pillars", () => {
    const weights = priorityWeights(baseProfile);
    expect(weights).toEqual({ movement: 30, training: 25, nutrition: 25, activity: 20 });
  });

  it("scoreParts returns 100 when all enabled pillars maxed", () => {
    const result = scoreParts(
      { runKm: 3, workoutCount: 1, mealsLogged: 3, steps: 10000 },
      baseProfile,
    );
    expect(result.score).toBe(100);
    expect(result.max).toBe(100);
  });

  it("scoreParts returns 0 when no pillars enabled", () => {
    const profile: Profile = {
      ...baseProfile,
      priorities: { running: false, strength: false, nutrition: false, steps: false, mobility: false },
    };
    const result = scoreParts({ runKm: 10, workoutCount: 1, mealsLogged: 3, steps: 20000 }, profile);
    expect(result.score).toBe(0);
    expect(result.max).toBe(0);
  });

  it("heatLevelFromScore buckets scores", () => {
    expect(heatLevelFromScore(0)).toBe(0);
    expect(heatLevelFromScore(25)).toBe(1);
    expect(heatLevelFromScore(50)).toBe(2);
    expect(heatLevelFromScore(80)).toBe(3);
    expect(heatLevelFromScore(100)).toBe(4);
  });

  it("activity heat levels map inputs", () => {
    expect(runHeatLevel(0)).toBe(0);
    expect(runHeatLevel(5)).toBe(3);
    expect(workoutHeatLevel(1)).toBe(4);
    expect(mealHeatLevel(3)).toBe(4);
  });
});
