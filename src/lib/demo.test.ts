import { describe, expect, it } from "vitest";
import { createBlankState } from "./demo";

describe("createBlankState", () => {
  it("has no history so you can track for real", () => {
    const state = createBlankState();
    expect(state.runs).toEqual([]);
    expect(state.workouts).toEqual([]);
    expect(state.foods).toEqual([]);
    expect(state.steps).toEqual([]);
    expect(state.weightLogs).toEqual([]);
    expect(state.integrations.every((item) => !item.connected)).toBe(true);
    expect(state.autoSync).toBe(false);
  });
});
