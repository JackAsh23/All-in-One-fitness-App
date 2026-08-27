import { describe, expect, it } from "vitest";
import { createBlankState } from "./demo";
import { todayISO } from "./dates";
import { runSync } from "./sync";

describe("runSync", () => {
  it("does not invent daily step counts from connected Health sources", () => {
    const date = todayISO();
    const state = {
      ...createBlankState(),
      dataMode: "live" as const,
      autoSync: true,
      integrations: createBlankState().integrations.map((item) =>
        item.id === "apple-health" ? { ...item, connected: true } : item,
      ),
      steps: [{ date, steps: 0 }],
    };
    const result = runSync(state);
    expect(result.updatedStepDays).toBe(0);
    expect(result.state.steps).toEqual(state.steps);
  });
});
