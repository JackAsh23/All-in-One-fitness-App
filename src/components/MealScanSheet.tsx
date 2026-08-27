import { Utensils } from "lucide-react";
import { Sheet } from "./Sheet";
import { macrosForGrams } from "../lib/foods";
import { getFoodById } from "../lib/nutrition";
import { SAMPLE_PLATES, type SamplePlate } from "../lib/samplePlates";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (meal: SamplePlate) => void;
};

function plateCalories(plate: SamplePlate) {
  return plate.items.reduce((sum, item) => {
    const food = getFoodById(item.foodId);
    return sum + (food ? macrosForGrams(food, item.grams).calories : 0);
  }, 0);
}

export function MealScanSheet({ open, onClose, onConfirm }: Props) {
  return (
    <Sheet open={open} title="Sample plates" onClose={onClose}>
      <p className="mb-3 text-sm text-fog">
        Photo meal recognition is not available yet. These are sample plates so you can try logging a full meal — use
        Search, barcode, or Quick add for real food.
      </p>
      <div className="space-y-2">
        {SAMPLE_PLATES.map((plate) => (
          <button
            key={plate.name}
            type="button"
            onClick={() => {
              onConfirm(plate);
              onClose();
            }}
            className="flex w-full items-start gap-3 rounded-2xl bg-card px-3 py-3 text-left"
          >
            <Utensils size={18} className="mt-0.5 shrink-0 text-eat" />
            <span className="min-w-0 flex-1">
              <p className="font-medium">{plate.name}</p>
              <p className="text-xs text-fog">
                {plate.items.length} items · ~{plateCalories(plate)} kcal
              </p>
            </span>
            <span className="shrink-0 text-sm font-semibold text-eat">Log</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
