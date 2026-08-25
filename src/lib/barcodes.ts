import { lookupOpenFoodFacts } from "./openFoodFacts";

export const BARCODE_MAP: Record<string, string> = {
  "4800123456789": "jollibee-chickenjoy",
  "4800987654321": "7e-siopao",
  "4800555123456": "kwek",
  "4800666123456": "mcdo-burger",
  "4800777123456": "mcdo-fries",
  "4800888123456": "jollibee-spaghetti",
  "4800999123456": "7e-coffee",
  "4800111222333": "adobo",
  "4800222333444": "chicken-breast",
  "4800333444555": "protein-shake",
};

export const DEMO_BARCODES = [
  { code: "4800123456789", label: "Jollibee Chickenjoy" },
  { code: "4800987654321", label: "7-Eleven siopao" },
  { code: "4800555123456", label: "Kwek-kwek" },
  { code: "4800666123456", label: "McDo Burger McDo" },
];

export function lookupBarcode(code: string): string | undefined {
  const normalized = code.replace(/\D/g, "");
  return BARCODE_MAP[normalized];
}

export async function resolveBarcode(code: string): Promise<{ foodId: string; grams: number } | null> {
  const localId = lookupBarcode(code);
  if (localId) return { foodId: localId, grams: 150 };

  const food = await lookupOpenFoodFacts(code);
  if (!food) return null;
  return { foodId: food.id, grams: food.servingGrams ?? 100 };
}
