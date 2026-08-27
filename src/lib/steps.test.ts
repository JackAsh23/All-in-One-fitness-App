import { describe, expect, it } from "vitest";
import { createBlankState } from "./demo";
import { todayISO } from "./dates";
import { summarizeDay } from "./scoring";
import {
  gpsStepsFromRuns,
  stepHeatLevel,
  stepsForDay,
  trustedLoggedSteps,
  RUN_STEPS_PER_KM,
  WALK_STEPS_PER_KM,
} from "./steps";
import type { RunLog } from "./types";

function run(partial: Partial<RunLog>): RunLog {
  return {
    id: "run_1",
    date: todayISO(),
    time: "07:00",
    distanceKm: 0,
    durationSec: 600,
    calories: 40,
    ...partial,
  };
}

describe("steps", () => {
  it("estimates GPS steps from walk and run distance", () => {
    expect(gpsStepsFromRuns([run({ kind: "walk", distanceKm: 2 })], todayISO())).toBe(2 * WALK_STEPS_PER_KM);
    expect(gpsStepsFromRuns([run({ kind: "run", distanceKm: 5 })], todayISO())).toBe(5 * RUN_STEPS_PER_KM);
  });

  it("ignores untagged live step logs from the old fake Health sync", () => {
    const state = {
      ...createBlankState(),
      dataMode: "live" as const,
      steps: [{ date: todayISO(), steps: 8421 }],
    };
    expect(trustedLoggedSteps(state, todayISO())).toBe(0);
    expect(stepsForDay(state, todayISO())).toBe(0);
  });

  it("keeps Stats logs and GPS distance, using the larger number", () => {
    const date = todayISO();
    const state = {
      ...createBlankState(),
      dataMode: "live" as const,
      steps: [{ date, steps: 9000, source: "manual" as const }],
      runs: [run({ date, kind: "walk", distanceKm: 3 })],
    };
    expect(stepsForDay(state, date)).toBe(9000);
    state.steps = [{ date, steps: 1000, source: "manual" }];
    expect(stepsForDay(state, date)).toBe(3 * WALK_STEPS_PER_KM);
  });

  it("feeds GPS steps into the day summary", () => {
    const date = todayISO();
    const state = {
      ...createBlankState(),
      runs: [run({ date, kind: "walk", distanceKm: 2 })],
    };
    expect(summarizeDay(state, date).steps).toBe(2 * WALK_STEPS_PER_KM);
  });

  it("buckets step heat from the goal", () => {
    expect(stepHeatLevel(0, 10000)).toBe(0);
    expect(stepHeatLevel(2000, 10000)).toBe(1);
    expect(stepHeatLevel(7500, 10000)).toBe(3);
    expect(stepHeatLevel(10000, 10000)).toBe(4);
  });
});
