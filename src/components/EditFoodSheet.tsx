import { useEffect, useState } from "react";
import { PortionStepper } from "./PortionStepper";
import { Sheet } from "./Sheet";
import { macrosForGrams } from "../lib/foods";
import { caloriesFromMacros, getFoodById, parseQuickAdd } from "../lib/nutrition";
import { parseDecimal } from "../lib/numbers";
import type { FoodLog, MealType } from "../lib/types";

const MEALS: { id: MealType; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "snacks", label: "Snacks" },
  { id: "dinner", label: "Dinner" },
];

type Props = {
  food: FoodLog | null;
  onClose: () => void;
  onSave: (id: string, patch: Pick<FoodLog, "name" | "meal" | "grams" | "calories" | "protein" | "carbs" | "fat">) => void;
  onRemove: (food: FoodLog) => void;
};

export function EditFoodSheet({ food, onClose, onSave, onRemove }: Props) {
  const [display, setDisplay] = useState<FoodLog | null>(food);
  const catalog = display?.foodId ? getFoodById(display.foodId) : undefined;
  const [name, setName] = useState("");
  const [meal, setMeal] = useState<MealType>("lunch");
  const [grams, setGrams] = useState(150);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  useEffect(() => {
    if (!food) return;
    setDisplay(food);
    setName(food.name);
    setMeal(food.meal);
    setGrams(food.grams);
    setCalories(String(food.calories));
    setProtein(String(food.protein));
    setCarbs(String(food.carbs));
    setFat(String(food.fat));
  }, [food]);

  function syncFromGrams(nextGrams: number) {
    setGrams(nextGrams);
    if (!catalog) return;
    const macros = macrosForGrams(catalog, nextGrams);
    setCalories(String(macros.calories));
    setProtein(String(macros.protein));
    setCarbs(String(macros.carbs));
    setFat(String(macros.fat));
  }

  function syncCalories(nextP: string, nextC: string, nextF: string) {
    const p = parseDecimal(nextP) ?? 0;
    const c = parseDecimal(nextC) ?? 0;
    const f = parseDecimal(nextF) ?? 0;
    if (nextP.trim() === "" && nextC.trim() === "" && nextF.trim() === "") {
      setCalories("");
      return;
    }
    setCalories(String(caloriesFromMacros(Math.max(0, p), Math.max(0, c), Math.max(0, f))));
  }

  const parsed = parseQuickAdd({ name, calories, protein, carbs, fat });

  return (
    <Sheet open={Boolean(food)} title="Edit food" onClose={onClose}>
      {display ? (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {MEALS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setMeal(section.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                  meal === section.id ? "bg-eat text-ink" : "bg-card text-snow"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
          <label className="block text-sm text-fog">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-card px-3 py-3 text-snow outline-none"
            />
          </label>
          {catalog ? (
            <>
              <p className="text-sm text-fog">Portion</p>
              <PortionStepper grams={grams} onChange={syncFromGrams} />
            </>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <MacroField
              label="Protein (g)"
              value={protein}
              onChange={(value) => {
                setProtein(value);
                syncCalories(value, carbs, fat);
              }}
            />
            <MacroField
              label="Carbs (g)"
              value={carbs}
              onChange={(value) => {
                setCarbs(value);
                syncCalories(protein, value, fat);
              }}
            />
            <MacroField
              label="Fat (g)"
              value={fat}
              onChange={(value) => {
                setFat(value);
                syncCalories(protein, carbs, value);
              }}
            />
            <MacroField label="Calories" value={calories} onChange={setCalories} />
          </div>
          <button
            type="button"
            disabled={!parsed}
            className="w-full rounded-2xl bg-eat py-3 font-semibold text-ink disabled:opacity-40"
            onClick={() => {
              if (!parsed) return;
              onSave(display.id, {
                name: parsed.name,
                meal,
                grams: catalog ? grams : display.grams,
                calories: parsed.calories,
                protein: parsed.protein,
                carbs: parsed.carbs,
                fat: parsed.fat,
              });
            }}
          >
            Save changes
          </button>
          <button
            type="button"
            className="w-full py-2 text-sm font-medium text-snow"
            onClick={() => onRemove(display)}
          >
            Remove from log
          </button>
        </div>
      ) : null}
    </Sheet>
  );
}

function MacroField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm text-fog">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-2xl border border-line bg-card px-3 py-3 text-snow outline-none"
        inputMode="decimal"
      />
    </label>
  );
}
