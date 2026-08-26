import { describe, expect, it } from "vitest";
import { bmiCategory, bodyMassIndex } from "./bmi";
import { parseDecimal, parseHeightCm } from "./numbers";

describe("bmi", () => {
  it("computes BMI from kg and height", () => {
    expect(bodyMassIndex(70, 175)).toBe(22.9);
    expect(bodyMassIndex(0, 175)).toBeNull();
    expect(bodyMassIndex(70, 0)).toBeNull();
  });

  it("computes BMI for 73.94 kg at 175.26 cm", () => {
    expect(bodyMassIndex(73.94, 175.26)).toBe(24.1);
    expect(bmiCategory(24.1).label).toBe("Healthy");
  });

  it("classifies WHO adult categories", () => {
    expect(bmiCategory(17).label).toBe("Underweight");
    expect(bmiCategory(22).label).toBe("Healthy");
    expect(bmiCategory(27).label).toBe("Overweight");
    expect(bmiCategory(32).label).toBe("Obese (class I)");
    expect(bmiCategory(41).label).toBe("Obese (class III)");
  });
});

describe("parseDecimal", () => {
  it("accepts period and comma decimals", () => {
    expect(parseDecimal("73.94")).toBe(73.94);
    expect(parseDecimal("73,94")).toBe(73.94);
    expect(parseDecimal("73.94 kg")).toBe(73.94);
  });

  it("returns null for empty or invalid input", () => {
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("abc")).toBeNull();
  });
});

describe("parseHeightCm", () => {
  it("accepts centimetres with period or comma", () => {
    expect(parseHeightCm("175.26")).toBe(175.26);
    expect(parseHeightCm("175,26")).toBe(175.26);
    expect(parseHeightCm("175.26 cm")).toBe(175.26);
  });

  it("treats 1.50–2.50 as metres", () => {
    expect(parseHeightCm("1.75")).toBe(175);
    expect(parseHeightCm("1,7526")).toBe(175.26);
  });

  it("parses feet and inches", () => {
    expect(parseHeightCm("5'9\"")).toBe(175.26);
    expect(parseHeightCm("5'9")).toBe(175.26);
  });
});
