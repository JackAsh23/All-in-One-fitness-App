import type { FoodItem } from "./foods";

const CACHE_KEY = "one-life-off-foods-v1";

type OffProduct = {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  quantity?: string;
  nutriments?: Record<string, number | string | undefined>;
};

type OffResponse = {
  status?: number;
  product?: OffProduct;
};

function loadCache(): Record<string, FoodItem> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, FoodItem>;
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, FoodItem>) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function normalizeBarcode(code: string): string {
  return code.replace(/\D/g, "");
}

export function offFoodId(barcode: string): string {
  return `off-${normalizeBarcode(barcode)}`;
}

export function getCachedOffFood(id: string): FoodItem | undefined {
  if (!id.startsWith("off-")) return undefined;
  const barcode = id.slice(4);
  return loadCache()[barcode];
}

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function per100gFromNutriments(nutriments: OffProduct["nutriments"]) {
  const n = nutriments ?? {};
  const calories =
    num(n["energy-kcal_100g"]) ??
    (num(n.energy_100g) != null ? Math.round(num(n.energy_100g)! / 4.184) : undefined) ??
    0;
  return {
    calories: Math.max(0, Math.round(calories)),
    protein: Math.max(0, Math.round((num(n.proteins_100g) ?? 0) * 10) / 10),
    carbs: Math.max(0, Math.round((num(n.carbohydrates_100g) ?? 0) * 10) / 10),
    fat: Math.max(0, Math.round((num(n.fat_100g) ?? 0) * 10) / 10),
  };
}

/** Parse "30 g", "330 ml", etc. into grams (ml treated as ~1g/ml for logging). */
export function parseServingGrams(text?: string): number | undefined {
  if (!text) return undefined;
  const match = text.toLowerCase().match(/([\d.]+)\s*(g|ml|kg|l)/);
  if (!match) return undefined;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  switch (match[2]) {
    case "kg":
      return Math.round(amount * 1000);
    case "l":
      return Math.round(amount * 1000);
    case "ml":
    case "g":
    default:
      return Math.round(amount);
  }
}

export function mapOffProduct(barcode: string, product: OffProduct): FoodItem | null {
  const name = product.product_name?.trim();
  if (!name) return null;

  const per100g = per100gFromNutriments(product.nutriments);
  const brand = product.brands?.split(",")[0]?.trim();
  const servingGrams =
    parseServingGrams(product.serving_size) ?? parseServingGrams(product.quantity) ?? 100;

  return {
    id: offFoodId(barcode),
    name,
    brand: brand || undefined,
    category: "Scanned",
    per100g,
    barcode,
    servingGrams,
  };
}

export async function lookupOpenFoodFacts(barcode: string): Promise<FoodItem | null> {
  const normalized = normalizeBarcode(barcode);
  if (normalized.length < 8) return null;

  const cache = loadCache();
  if (cache[normalized]) return cache[normalized];

  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${normalized}.json?fields=product_name,brands,nutriments,serving_size,quantity`,
  );
  if (!response.ok) return null;

  const data = (await response.json()) as OffResponse;
  if (data.status !== 1 || !data.product) return null;

  const food = mapOffProduct(normalized, data.product);
  if (!food) return null;

  cache[normalized] = food;
  saveCache(cache);
  return food;
}
