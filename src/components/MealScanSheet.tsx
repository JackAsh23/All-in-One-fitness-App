import { useState } from "react";
import { Camera } from "lucide-react";
import { Sheet } from "./Sheet";
import { FOODS } from "../lib/foods";

export type ScannedMeal = {
  name: string;
  items: { foodId: string; grams: number }[];
};

const DEMO_PLATES: ScannedMeal[] = [
  {
    name: "Chicken rice bowl",
    items: [
      { foodId: "rice", grams: 200 },
      { foodId: "chicken-breast", grams: 150 },
      { foodId: "egg", grams: 100 },
    ],
  },
  {
    name: "Adobo plate",
    items: [
      { foodId: "adobo", grams: 180 },
      { foodId: "rice", grams: 180 },
    ],
  },
  {
    name: "Breakfast silog",
    items: [
      { foodId: "garlic-rice", grams: 150 },
      { foodId: "egg", grams: 100 },
      { foodId: "tocino", grams: 120 },
    ],
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (meal: ScannedMeal) => void;
};

export function MealScanSheet({ open, onClose, onConfirm }: Props) {
  const [status, setStatus] = useState<"idle" | "scanning" | "result">("idle");
  const [result, setResult] = useState<ScannedMeal | null>(null);

  function analyze() {
    setStatus("scanning");
    window.setTimeout(() => {
      const pick = DEMO_PLATES[Math.floor(Math.random() * DEMO_PLATES.length)];
      setResult(pick);
      setStatus("result");
    }, 1400);
  }

  function resetAndClose() {
    setStatus("idle");
    setResult(null);
    onClose();
  }

  return (
    <Sheet open={open} title="Meal scan" onClose={resetAndClose}>
      {status === "idle" ? (
        <div className="space-y-3">
          <p className="text-sm text-fog">
            Snap a plate and we&apos;ll guess the foods. This prototype uses a demo recognizer — on-device AI comes later.
          </p>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-3xl border border-dashed border-line bg-card py-10 text-fog">
            <Camera size={20} />
            Take or choose a photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={() => analyze()}
            />
          </label>
          <button type="button" onClick={analyze} className="w-full rounded-2xl bg-eat py-3 font-semibold text-ink">
            Try a demo plate
          </button>
        </div>
      ) : null}
      {status === "scanning" ? (
        <div className="py-10 text-center">
          <p className="text-sm uppercase tracking-[0.18em] text-eat">Scanning plate</p>
          <p className="mt-2 text-fog">Guessing macros from the photo…</p>
        </div>
      ) : null}
      {status === "result" && result ? (
        <div className="space-y-3">
          <p className="text-sm text-fog">Looks like</p>
          <h3 className="text-xl font-semibold">{result.name}</h3>
          <ul className="space-y-2">
            {result.items.map((item) => {
              const food = FOODS.find((f) => f.id === item.foodId);
              return (
                <li key={item.foodId} className="flex justify-between rounded-2xl bg-card px-3 py-2">
                  <span>{food?.name ?? item.foodId}</span>
                  <span className="font-mono text-fog">{item.grams}g</span>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="w-full rounded-2xl bg-eat py-3 font-semibold text-ink"
            onClick={() => {
              onConfirm(result);
              resetAndClose();
            }}
          >
            Log this meal
          </button>
          <button type="button" className="w-full text-sm font-medium text-snow" onClick={analyze}>
            Scan again
          </button>
        </div>
      ) : null}
    </Sheet>
  );
}
