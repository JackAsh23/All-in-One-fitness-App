import type { FoodItem } from "./foods";
import { FOODS } from "./foods";
import { getCachedOffFood } from "./openFoodFacts";
import type { MealType } from "./types";

export function getFoodById(id: string): FoodItem | undefined {
  return FOODS.find((food) => food.id === id) ?? getCachedOffFood(id);
}

export function foodCategories(): string[] {
  return [...new Set(FOODS.map((food) => food.category))].sort();
}

export function defaultMealType(now = new Date()): MealType {
  const hour = now.getHours();
  if (hour < 10) return "breakfast";
  if (hour < 14) return "lunch";
  if (hour < 17) return "snacks";
  return "dinner";
}

export function foodsByCategory(category: string | null): FoodItem[] {
  if (!category) return FOODS;
  return FOODS.filter((food) => food.category === category);
}

export type RecentEntry = {
  foodId: string;
  grams: number;
  at: string;
};

export function buildRecentList(entries: RecentEntry[], limit = 8): RecentEntry[] {
  const seen = new Set<string>();
  const out: RecentEntry[] = [];
  for (const entry of [...entries].sort((a, b) => b.at.localeCompare(a.at))) {
    if (seen.has(entry.foodId)) continue;
    seen.add(entry.foodId);
    out.push(entry);
    if (out.length >= limit) break;
  }
  return out;
}
