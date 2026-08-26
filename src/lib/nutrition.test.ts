import { describe, expect, it } from "vitest";
import { defaultMealType } from "./nutrition";

describe("defaultMealType", () => {
  it("picks breakfast in the morning", () => {
    expect(defaultMealType(new Date(2026, 7, 26, 7, 30))).toBe("breakfast");
  });

  it("picks lunch midday", () => {
    expect(defaultMealType(new Date(2026, 7, 26, 12, 0))).toBe("lunch");
  });

  it("picks snacks mid-afternoon", () => {
    expect(defaultMealType(new Date(2026, 7, 26, 15, 0))).toBe("snacks");
  });

  it("picks dinner in the evening", () => {
    expect(defaultMealType(new Date(2026, 7, 26, 19, 0))).toBe("dinner");
  });
});
