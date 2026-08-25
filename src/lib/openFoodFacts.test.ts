import { describe, expect, it } from "vitest";
import { mapOffProduct, normalizeBarcode, offFoodId, parseServingGrams } from "./openFoodFacts";

describe("openFoodFacts", () => {
  it("normalizes barcode digits", () => {
    expect(normalizeBarcode("4800-1234-5678-9")).toBe("4800123456789");
  });

  it("maps Open Food Facts product to FoodItem", () => {
    const food = mapOffProduct("3017620422003", {
      product_name: "Nutella",
      brands: "Ferrero",
      serving_size: "15 g",
      nutriments: {
        "energy-kcal_100g": 539,
        proteins_100g: 6.3,
        carbohydrates_100g: 57.5,
        fat_100g: 30.9,
      },
    });

    expect(food).toMatchObject({
      id: offFoodId("3017620422003"),
      name: "Nutella",
      brand: "Ferrero",
      category: "Scanned",
      servingGrams: 15,
      per100g: { calories: 539, protein: 6.3, carbs: 57.5, fat: 30.9 },
    });
  });

  it("parses serving sizes", () => {
    expect(parseServingGrams("330 ml")).toBe(330);
    expect(parseServingGrams("1 kg")).toBe(1000);
    expect(parseServingGrams("n/a")).toBeUndefined();
  });
});
