import { describe, expect, it } from "vitest";
import { markTrainingFillPlayed, shouldPlayTrainingFill } from "./ringFill";

function memory() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe("ringFill", () => {
  it("plays once after today's lift is complete, not on later visits", () => {
    const storage = memory();
    expect(shouldPlayTrainingFill("2026-08-27", false, storage)).toBe(false);
    expect(shouldPlayTrainingFill("2026-08-27", true, storage)).toBe(true);
    markTrainingFillPlayed("2026-08-27", storage);
    expect(shouldPlayTrainingFill("2026-08-27", true, storage)).toBe(false);
  });

  it("plays again on a new day", () => {
    const storage = memory();
    markTrainingFillPlayed("2026-08-26", storage);
    expect(shouldPlayTrainingFill("2026-08-27", true, storage)).toBe(true);
  });
});
