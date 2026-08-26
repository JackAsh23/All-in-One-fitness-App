import { describe, expect, it } from "vitest";
import { bmiCategory, bodyMassIndex } from "./bmi";

describe("bmi", () => {
  it("computes BMI from kg and height", () => {
    expect(bodyMassIndex(70, 175)).toBe(22.9);
    expect(bodyMassIndex(0, 175)).toBeNull();
    expect(bodyMassIndex(70, 0)).toBeNull();
  });

  it("classifies WHO adult categories", () => {
    expect(bmiCategory(17).label).toBe("Underweight");
    expect(bmiCategory(22).label).toBe("Healthy");
    expect(bmiCategory(27).label).toBe("Overweight");
    expect(bmiCategory(32).label).toBe("Obese (class I)");
    expect(bmiCategory(41).label).toBe("Obese (class III)");
  });
});
