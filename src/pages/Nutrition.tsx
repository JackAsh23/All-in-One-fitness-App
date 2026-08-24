import { useMemo, useState } from "react";
import { Card } from "../components/Heatmap";
import { MacroBar } from "../components/Progress";
import { Sheet } from "../components/Sheet";
import { nowTime, todayISO, uid } from "../lib/dates";
import { FOODS, macrosForGrams, searchFoods } from "../lib/foods";
import { addFood, removeFood, useAppState } from "../lib/store";
import type { MealType } from "../lib/types";

const MEALS: { id: MealType; label: string; emoji: string }[] = [
  { id: "breakfast", label: "Breakfast", emoji: "🍳" },
  { id: "lunch", label: "Lunch", emoji: "🍱" },
  { id: "snacks", label: "Snacks", emoji: "☕" },
  { id: "dinner", label: "Dinner", emoji: "🍽" },
];

export function NutritionPage() {
  const state = useAppState();
  const today = todayISO();
  const [query, setQuery] = useState("");
  const [meal, setMeal] = useState<MealType>("lunch");
  const [grams, setGrams] = useState("150");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(FOODS[0]?.id);

  const todays = state.foods.filter((food) => food.date === today);
  const totals = todays.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const results = useMemo(() => searchFoods(query), [query]);
  const selected = FOODS.find((food) => food.id === selectedId) ?? results[0];
  const preview = selected ? macrosForGrams(selected, Number(grams) || 0) : null;

  function save() {
    if (!selected || !preview) return;
    addFood({
      id: uid("food"),
      date: today,
      time: nowTime(),
      meal,
      name: selected.name,
      grams: Number(grams) || 0,
      ...preview,
    });
    setOpen(false);
  }

  return (
    <div className="space-y-4 animate-pop">
      <h2 className="text-2xl font-semibold">Nutrition</h2>
      <Card>
        <p className="text-xs uppercase tracking-[0.18em] text-eat">Daily overview</p>
        <p className="mt-1 font-mono text-3xl">
          {Math.round(totals.calories)} <span className="text-lg text-fog">/ {state.profile.calorieGoal} kcal</span>
        </p>
        <div className="mt-4 space-y-3">
          <MacroBar label="Protein" value={totals.protein} goal={state.profile.proteinGoal} color="#3ee07f" />
          <MacroBar label="Carbs" value={totals.carbs} goal={state.profile.carbGoal} color="#7aa6ff" />
          <MacroBar label="Fat" value={totals.fat} goal={state.profile.fatGoal} color="#ff6b4a" />
        </div>
      </Card>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-3xl bg-eat py-3 font-semibold text-ink"
      >
        Add Filipino food
      </button>

      {MEALS.map((section) => {
        const items = todays.filter((food) => food.meal === section.id);
        const kcal = items.reduce((sum, food) => sum + food.calories, 0);
        return (
          <Card key={section.id}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">
                {section.emoji} {section.label}
              </h3>
              <span className="font-mono text-sm text-fog">{Math.round(kcal)} kcal</span>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-fog">Nothing logged.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((food) => (
                  <li key={food.id} className="flex items-start justify-between gap-3 rounded-2xl bg-ink px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate">{food.name}</p>
                      <p className="text-xs text-fog">
                        {food.grams}g · P{Math.round(food.protein)} C{Math.round(food.carbs)} F{Math.round(food.fat)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 text-xs text-fog underline-offset-2 hover:text-snow hover:underline"
                      onClick={() => removeFood(food.id)}
                      aria-label={`Remove ${food.name}`}
                    >
                      {food.calories} kcal
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}

      <Sheet open={open} title="Log food" onClose={() => setOpen(false)}>
        <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {MEALS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setMeal(section.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                meal === section.id ? "bg-eat text-ink" : "bg-card text-fog"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search adobo, kwek-kwek, Jollibee…"
          className="mb-3 w-full rounded-2xl border border-line bg-card px-3 py-3 outline-none"
        />
        <div className="mb-3 max-h-48 space-y-1 overflow-y-auto">
          {results.slice(0, 12).map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => setSelectedId(food.id)}
              className={`w-full rounded-2xl px-3 py-2 text-left ${
                selectedId === food.id ? "bg-life/15 text-life" : "bg-card"
              }`}
            >
              <p>{food.name}</p>
              <p className="text-xs text-fog">
                {food.category}
                {food.brand ? ` · ${food.brand}` : ""} · {food.per100g.calories} kcal/100g
              </p>
            </button>
          ))}
        </div>
        <label className="block text-sm text-fog">
          Portion (grams)
          <input
            value={grams}
            onChange={(event) => setGrams(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-line bg-card px-3 py-3 text-snow"
            inputMode="numeric"
          />
        </label>
        {preview ? (
          <p className="mt-3 text-sm text-fog">
            {preview.calories} kcal · P{preview.protein} C{preview.carbs} F{preview.fat}
          </p>
        ) : null}
        <button type="button" onClick={save} className="mt-4 w-full rounded-2xl bg-eat py-3 font-semibold text-ink">
          Add to {meal}
        </button>
      </Sheet>
    </div>
  );
}
