import { describe, expect, it } from "vitest";
import { getFoodById } from "./nutrition";
import { SAMPLE_PLATES } from "./samplePlates";

describe("SAMPLE_PLATES", () => {
  it("only references foods that exist in the database", () => {
    for (const plate of SAMPLE_PLATES) {
      expect(plate.items.length).toBeGreaterThan(0);
      for (const item of plate.items) {
        expect(getFoodById(item.foodId), item.foodId).toBeDefined();
        expect(item.grams).toBeGreaterThan(0);
      }
    }
  });
});
