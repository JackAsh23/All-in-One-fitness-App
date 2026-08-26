import { describe, expect, it } from "vitest";
import { createBlankState, createDemoState } from "./demo";
import { isVirginBlank, looksLikeSeededDemo, preferPersistedState } from "./persistChoice";

describe("persistChoice", () => {
  it("treats the seeded year as demo and a blank tracker as live", () => {
    expect(looksLikeSeededDemo(createDemoState())).toBe(true);
    expect(looksLikeSeededDemo(createBlankState())).toBe(false);
    expect(isVirginBlank(createBlankState())).toBe(true);
    expect(isVirginBlank(createDemoState())).toBe(false);
  });

  it("restores saved live data when localStorage is an empty first load", () => {
    const live = {
      ...createBlankState(),
      dataMode: "live" as const,
      savedAt: "2026-08-26T10:00:00.000Z",
      foods: [
        {
          id: "food_1",
          date: "2026-08-26",
          time: "08:00",
          meal: "breakfast" as const,
          name: "Eggs",
          grams: 100,
          calories: 140,
          protein: 12,
          carbs: 1,
          fat: 10,
        },
      ],
    };
    expect(preferPersistedState(createBlankState(), live)).toEqual(live);
  });

  it("does not restore the demo year onto an empty first load", () => {
    const chosen = preferPersistedState(createBlankState(), createDemoState());
    expect(looksLikeSeededDemo(chosen)).toBe(false);
    expect(chosen.runs).toEqual([]);
    expect(chosen.foods).toEqual([]);
  });

  it("keeps a saved live blank instead of restoring the demo year after an update", () => {
    const liveBlank = {
      ...createBlankState(),
      dataMode: "live" as const,
      savedAt: "2026-08-26T12:00:00.000Z",
    };
    const demo = { ...createDemoState(), savedAt: "2026-08-26T09:00:00.000Z" };
    const chosen = preferPersistedState(liveBlank, demo);
    expect(looksLikeSeededDemo(chosen)).toBe(false);
    expect(chosen.foods).toEqual([]);
    expect(chosen.dataMode).toBe("live");
  });

  it("prefers the newer live snapshot when both are real data", () => {
    const older = {
      ...createBlankState(),
      dataMode: "live" as const,
      savedAt: "2026-08-26T08:00:00.000Z",
      profile: { ...createBlankState().profile, name: "Older" },
    };
    const newer = {
      ...createBlankState(),
      dataMode: "live" as const,
      savedAt: "2026-08-26T18:00:00.000Z",
      profile: { ...createBlankState().profile, name: "Newer" },
    };
    expect(preferPersistedState(older, newer).profile.name).toBe("Newer");
    expect(preferPersistedState(newer, older).profile.name).toBe("Newer");
  });
});
