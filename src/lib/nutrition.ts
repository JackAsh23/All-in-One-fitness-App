import type { FoodItem } from "./foods";
import { FOODS } from "./foods";
import { parseDecimal } from "./numbers";
import { getCachedOffFood } from "./openFoodFacts";
import type { MealType } from "./types";

/** Atwater factors: protein and carbs 4 kcal/g, fat 9 kcal/g. */
export function caloriesFromMacros(protein: number, carbs: number, fat: number): number {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}

export function parseMacroGrams(raw: string): number | null {
  const n = parseDecimal(raw);
  if (n == null || n < 0) return null;
  return Math.round(n * 10) / 10;
}

export function parseCaloriesInput(raw: string): number | null {
  const n = parseDecimal(raw);
  if (n == null || n < 0) return null;
  return Math.round(n);
}

export type QuickAddValues = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/** Name + calories + protein + carbs + fat must all be filled (0 is allowed, blank is not). */
export function parseQuickAdd(input: {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}): QuickAddValues | null {
  const name = input.name.trim();
  const calories = parseCaloriesInput(input.calories);
  const protein = parseMacroGrams(input.protein);
  const carbs = parseMacroGrams(input.carbs);
  const fat = parseMacroGrams(input.fat);
  if (!name || calories == null || protein == null || carbs == null || fat == null) return null;
  return { name, calories, protein, carbs, fat };
}

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
