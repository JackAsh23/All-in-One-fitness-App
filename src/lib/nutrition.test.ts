import { describe, expect, it } from "vitest";
import {
  caloriesFromMacros,
  defaultMealType,
  parseCaloriesInput,
  parseMacroGrams,
  parseQuickAdd,
} from "./nutrition";

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

describe("caloriesFromMacros", () => {
  it("uses 4 / 4 / 9 kcal per gram", () => {
    expect(caloriesFromMacros(34, 0, 20)).toBe(34 * 4 + 20 * 9);
    expect(caloriesFromMacros(20, 25, 8)).toBe(252);
  });

  it("treats missing macros as zero when computing a live total", () => {
    expect(caloriesFromMacros(34, 0, 0)).toBe(136);
  });
});

describe("parseQuickAdd", () => {
  it("rejects a blank protein field even if other macros are filled", () => {
    expect(
      parseQuickAdd({
        name: "Chicken",
        calories: "136",
        protein: "",
        carbs: "0",
        fat: "0",
      }),
    ).toBeNull();
  });

  it("rejects a blank name", () => {
    expect(
      parseQuickAdd({
        name: "  ",
        calories: "80",
        protein: "20",
        carbs: "0",
        fat: "0",
      }),
    ).toBeNull();
  });

  it("allows zero grams when the field is actually filled", () => {
    expect(
      parseQuickAdd({
        name: "Oil",
        calories: "180",
        protein: "0",
        carbs: "0",
        fat: "20",
      }),
    ).toEqual({
      name: "Oil",
      calories: 180,
      protein: 0,
      carbs: 0,
      fat: 20,
    });
  });

  it("parses comma decimals", () => {
    expect(parseMacroGrams("20,5")).toBe(20.5);
    expect(parseCaloriesInput("251,4")).toBe(251);
  });
});
