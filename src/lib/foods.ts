export type FoodItem = {
  id: string;
  name: string;
  brand?: string;
  category: string;
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

export const FOODS: FoodItem[] = [
  { id: "rice", name: "White rice, cooked", category: "Staples", per100g: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 } },
  { id: "garlic-rice", name: "Garlic fried rice", category: "Staples", per100g: { calories: 168, protein: 3.1, carbs: 27, fat: 5.2 } },
  { id: "chicken-breast", name: "Chicken breast, grilled", category: "Protein", per100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6 } },
  { id: "egg", name: "Boiled egg", category: "Protein", per100g: { calories: 155, protein: 13, carbs: 1.1, fat: 11 } },
  { id: "adobo", name: "Chicken adobo", category: "Filipino", per100g: { calories: 170, protein: 16, carbs: 4, fat: 9 } },
  { id: "sinigang", name: "Sinigang na baboy", category: "Filipino", per100g: { calories: 95, protein: 8, carbs: 4, fat: 5 } },
  { id: "bicol", name: "Bicol Express", category: "Filipino", per100g: { calories: 210, protein: 12, carbs: 6, fat: 15 } },
  { id: "shanghai", name: "Lumpia Shanghai", category: "Filipino", per100g: { calories: 250, protein: 12, carbs: 16, fat: 15 } },
  { id: "kwek", name: "Kwek-kwek", category: "Filipino", per100g: { calories: 220, protein: 8, carbs: 18, fat: 13 } },
  { id: "tocino", name: "Tocino", category: "Filipino", per100g: { calories: 240, protein: 14, carbs: 12, fat: 15 } },
  { id: "longganisa", name: "Longganisa", category: "Filipino", per100g: { calories: 300, protein: 13, carbs: 6, fat: 25 } },
  { id: "tapsilog", name: "Tapsilog (plate)", category: "Filipino", per100g: { calories: 190, protein: 12, carbs: 16, fat: 8 } },
  { id: "pancit", name: "Pancit canton", category: "Filipino", per100g: { calories: 160, protein: 6, carbs: 22, fat: 5 } },
  { id: "sisig", name: "Sisig", category: "Filipino", per100g: { calories: 280, protein: 18, carbs: 4, fat: 21 } },
  { id: "lechon-kawali", name: "Lechon kawali", category: "Filipino", per100g: { calories: 340, protein: 18, carbs: 2, fat: 29 } },
  { id: "tinola", name: "Chicken tinola", category: "Filipino", per100g: { calories: 85, protein: 10, carbs: 3, fat: 3 } },
  { id: "bangus", name: "Fried bangus", category: "Filipino", per100g: { calories: 220, protein: 22, carbs: 0, fat: 14 } },
  { id: "mango", name: "Mango, ripe", category: "Fruit", per100g: { calories: 60, protein: 0.8, carbs: 15, fat: 0.4 } },
  { id: "banana", name: "Latundan banana", category: "Fruit", per100g: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 } },
  { id: "oats", name: "Oatmeal, cooked", category: "Staples", per100g: { calories: 71, protein: 2.5, carbs: 12, fat: 1.5 } },
  { id: "protein-shake", name: "Whey protein shake", category: "Protein", per100g: { calories: 80, protein: 16, carbs: 3, fat: 1 } },
  { id: "greek-yogurt", name: "Greek yogurt", category: "Protein", per100g: { calories: 97, protein: 9, carbs: 4, fat: 5 } },
  { id: "broccoli", name: "Broccoli, steamed", category: "Veg", per100g: { calories: 35, protein: 2.4, carbs: 7, fat: 0.4 } },
  { id: "sweet-potato", name: "Kamote, boiled", category: "Staples", per100g: { calories: 86, protein: 1.6, carbs: 20, fat: 0.1 } },
  { id: "jollibee-chickenjoy", name: "Jollibee Chickenjoy piece", brand: "Jollibee", category: "Restaurants", per100g: { calories: 280, protein: 18, carbs: 10, fat: 18 } },
  { id: "jollibee-spaghetti", name: "Jollibee spaghetti", brand: "Jollibee", category: "Restaurants", per100g: { calories: 170, protein: 6, carbs: 24, fat: 6 } },
  { id: "mcdo-burger", name: "McDo Burger McDo", brand: "McDonald's PH", category: "Restaurants", per100g: { calories: 250, protein: 12, carbs: 26, fat: 11 } },
  { id: "mcdo-fries", name: "McDo fries", brand: "McDonald's PH", category: "Restaurants", per100g: { calories: 312, protein: 3.4, carbs: 41, fat: 15 } },
  { id: "7e-siopao", name: "7-Eleven siopao", brand: "7-Eleven PH", category: "Convenience", per100g: { calories: 210, protein: 8, carbs: 30, fat: 6 } },
  { id: "7e-coffee", name: "7-Eleven iced coffee", brand: "7-Eleven PH", category: "Convenience", per100g: { calories: 42, protein: 0.8, carbs: 8, fat: 0.8 } },
  { id: "pork-chop", name: "Pork chop, grilled", category: "Protein", per100g: { calories: 231, protein: 24, carbs: 0, fat: 14 } },
  { id: "tilapia", name: "Tilapia, grilled", category: "Protein", per100g: { calories: 128, protein: 26, carbs: 0, fat: 2.7 } },
  { id: "peanut-butter", name: "Peanut butter", category: "Snacks", per100g: { calories: 588, protein: 25, carbs: 20, fat: 50 } },
  { id: "banana-cue", name: "Banana cue", category: "Filipino", per100g: { calories: 190, protein: 1.2, carbs: 36, fat: 5 } },
  { id: "halo-halo", name: "Halo-halo", category: "Filipino", per100g: { calories: 140, protein: 2, carbs: 28, fat: 3 } },
  { id: "calamansi-juice", name: "Calamansi juice, sweetened", category: "Drinks", per100g: { calories: 45, protein: 0, carbs: 11, fat: 0 } },
];

export function searchFoods(query: string): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return FOODS;
  return FOODS.filter((food) =>
    [food.name, food.brand, food.category].filter(Boolean).some((part) => part!.toLowerCase().includes(q)),
  );
}

export function macrosForGrams(food: FoodItem, grams: number) {
  const factor = grams / 100;
  return {
    calories: Math.round(food.per100g.calories * factor),
    protein: Math.round(food.per100g.protein * factor * 10) / 10,
    carbs: Math.round(food.per100g.carbs * factor * 10) / 10,
    fat: Math.round(food.per100g.fat * factor * 10) / 10,
  };
}
