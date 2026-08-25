import { useMemo, useState, type ReactNode } from "react";
import { Barcode, Camera, Plus, ScanLine, Search, Star, Weight } from "lucide-react";
import { BarcodeSheet } from "../components/BarcodeSheet";
import { Card } from "../components/Heatmap";
import { MacroBar } from "../components/Progress";
import { MealScanSheet } from "../components/MealScanSheet";
import { MonthCalendar } from "../components/MonthCalendar";
import { PortionStepper } from "../components/PortionStepper";
import { Sheet } from "../components/Sheet";
import { lookupBarcode } from "../lib/barcodes";
import { foodCategories, buildRecentList, getFoodById } from "../lib/nutrition";
import { FOODS, macrosForGrams, searchFoods } from "../lib/foods";
import { weightStats } from "../lib/analytics";
import {
  logFoodItem,
  logQuickFood,
  logSavedMeal,
  logWeight,
  removeFood,
  removeSavedMeal,
  saveMealFromToday,
  toggleFavoriteFood,
  updateFoodPortion,
  updateProfile,
  useAppState,
} from "../lib/store";
import { todayISO } from "../lib/dates";
import type { MealType } from "../lib/types";

const MEALS: { id: MealType; label: string; emoji: string }[] = [
  { id: "breakfast", label: "Breakfast", emoji: "🍳" },
  { id: "lunch", label: "Lunch", emoji: "🍱" },
  { id: "snacks", label: "Snacks", emoji: "☕" },
  { id: "dinner", label: "Dinner", emoji: "🍽" },
];

type Chooser = "closed" | "menu" | "search" | "quick";

export function NutritionPage() {
  const state = useAppState();
  const today = todayISO();
  const [viewDate, setViewDate] = useState(today);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [meal, setMeal] = useState<MealType>("lunch");
  const [grams, setGrams] = useState(150);
  const [chooser, setChooser] = useState<Chooser>("closed");
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(FOODS[0]?.id);
  const [quickName, setQuickName] = useState("");
  const [quickCal, setQuickCal] = useState("250");
  const [quickP, setQuickP] = useState("20");
  const [quickC, setQuickC] = useState("25");
  const [quickF, setQuickF] = useState("8");
  const [weightInput, setWeightInput] = useState(String(state.profile.currentWeightKg ?? 76));
  const [targetInput, setTargetInput] = useState(String(state.profile.targetWeightKg ?? 74));

  const daysFoods = state.foods.filter((food) => food.date === viewDate);
  const totals = daysFoods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const loggedDates = useMemo(() => new Set(state.foods.map((food) => food.date)), [state.foods]);
  const weights = weightStats(state);
  const isToday = viewDate === today;

  const results = useMemo(() => {
    const base = category ? FOODS.filter((food) => food.category === category) : FOODS;
    if (!query.trim()) return base;
    return searchFoods(query).filter((food) => !category || food.category === category);
  }, [query, category]);

  const selected = FOODS.find((food) => food.id === selectedId) ?? results[0];
  const preview = selected ? macrosForGrams(selected, grams) : null;
  const recent = buildRecentList(state.recentFoods);
  const favorites = state.favoriteFoodIds.map(getFoodById).filter(Boolean);

  function openFood(id: string, defaultGrams = 150) {
    setSelectedId(id);
    setGrams(defaultGrams);
    setChooser("search");
  }

  function saveSearch() {
    if (!selected) return;
    logFoodItem({ foodId: selected.id, grams, meal, date: viewDate });
    setChooser("closed");
  }

  function handleBarcode(code: string) {
    const foodId = lookupBarcode(code);
    if (!foodId) {
      window.alert("Barcode not in database yet. Try a demo scan.");
      return;
    }
    setBarcodeOpen(false);
    openFood(foodId, 150);
  }

  function saveQuick() {
    logQuickFood({
      name: quickName,
      meal,
      calories: Number(quickCal) || 0,
      protein: Number(quickP) || 0,
      carbs: Number(quickC) || 0,
      fat: Number(quickF) || 0,
      date: viewDate,
    });
    setChooser("closed");
  }

  return (
    <div className="space-y-4 animate-pop pb-16">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-eat">Fuel</p>
          <h2 className="text-2xl font-semibold">Nutrition</h2>
        </div>
        <p className="text-xs text-fog">{isToday ? "Today" : viewDate}</p>
      </div>

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

      <Card>
        <h3 className="mb-3 font-semibold">Food log calendar</h3>
        <MonthCalendar selected={viewDate} marked={loggedDates} onSelect={setViewDate} accent="bg-eat text-ink" />
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Weight</h3>
          <Weight size={16} className="text-step" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <WeightChip label="Now" value={weights.current ? `${weights.current}` : "—"} />
          <WeightChip label="Target" value={weights.target ? `${weights.target}` : "—"} />
          <WeightChip
            label="To go"
            value={weights.remaining == null ? "—" : `${weights.remaining > 0 ? "-" : "+"}${Math.abs(weights.remaining)}`}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-xs text-fog">
            Log kg
            <input
              value={weightInput}
              onChange={(event) => setWeightInput(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-ink px-3 py-2 text-snow"
              inputMode="decimal"
            />
          </label>
          <label className="text-xs text-fog">
            Target kg
            <input
              value={targetInput}
              onChange={(event) => setTargetInput(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-ink px-3 py-2 text-snow"
              inputMode="decimal"
            />
          </label>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-2xl bg-eat py-2 text-sm font-semibold text-ink"
            onClick={() => logWeight(viewDate, Number(weightInput))}
          >
            Save weigh-in
          </button>
          <button
            type="button"
            className="rounded-2xl bg-card py-2 text-sm"
            onClick={() => updateProfile({ targetWeightKg: Number(targetInput) || undefined })}
          >
            Save target
          </button>
        </div>
      </Card>

      {state.savedMeals.length > 0 ? (
        <Card>
          <h3 className="mb-3 font-semibold">Saved meals</h3>
          <div className="space-y-2">
            {state.savedMeals.map((saved) => {
              const kcal = saved.items.reduce((sum, item) => {
                const food = getFoodById(item.foodId);
                return sum + (food ? macrosForGrams(food, item.grams).calories : 0);
              }, 0);
              return (
                <div key={saved.id} className="flex items-center gap-2 rounded-2xl bg-ink px-3 py-2">
                  <button
                    type="button"
                    onClick={() => logSavedMeal(saved.id, meal, viewDate)}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    <span>{saved.emoji}</span>
                    <span>
                      <p className="font-medium">{saved.name}</p>
                      <p className="text-xs text-fog">
                        {saved.items.length} items · ~{kcal} kcal
                      </p>
                    </span>
                  </button>
                  <button type="button" className="text-xs text-fog" onClick={() => removeSavedMeal(saved.id)}>
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {recent.length > 0 ? (
        <Card>
          <h3 className="mb-3 font-semibold">Recent</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {recent.map((entry) => {
              const food = getFoodById(entry.foodId);
              if (!food) return null;
              return (
                <button
                  key={entry.foodId}
                  type="button"
                  onClick={() => logFoodItem({ foodId: entry.foodId, grams: entry.grams, meal, date: viewDate })}
                  className="shrink-0 rounded-2xl bg-ink px-3 py-2 text-left"
                >
                  <p className="text-sm font-medium">{food.name.split(",")[0]}</p>
                  <p className="text-xs text-fog">{entry.grams}g · tap to re-log</p>
                </button>
              );
            })}
          </div>
        </Card>
      ) : null}

      {favorites.length > 0 ? (
        <Card>
          <h3 className="mb-3 font-semibold">Favorites</h3>
          <div className="flex flex-wrap gap-2">
            {favorites.map((food) => (
              <button
                key={food!.id}
                type="button"
                onClick={() => openFood(food!.id)}
                className="rounded-full bg-life/15 px-3 py-1.5 text-sm text-life"
              >
                {food!.name.split(",")[0]}
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      {MEALS.map((section) => {
        const items = daysFoods.filter((food) => food.meal === section.id);
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
              <>
                <ul className="space-y-3">
                  {items.map((food) => (
                    <li key={food.id} className="rounded-2xl bg-ink px-3 py-3">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{food.name}</p>
                          <p className="text-xs text-fog">
                            {food.calories} kcal · P{Math.round(food.protein)} C{Math.round(food.carbs)} F
                            {Math.round(food.fat)}
                          </p>
                        </div>
                        <button type="button" className="shrink-0 text-xs text-fog" onClick={() => removeFood(food.id)}>
                          Remove
                        </button>
                      </div>
                      {food.foodId ? (
                        <PortionStepper grams={food.grams} onChange={(value) => updateFoodPortion(food.id, value)} />
                      ) : null}
                    </li>
                  ))}
                </ul>
                {isToday ? (
                  <button
                    type="button"
                    onClick={() => saveMealFromToday(section.id, `${section.label} plate`, section.emoji)}
                    className="mt-3 text-sm text-eat"
                  >
                    Save {section.label.toLowerCase()} as meal template
                  </button>
                ) : null}
              </>
            )}
          </Card>
        );
      })}

      <button
        type="button"
        onClick={() => setChooser("menu")}
        className="fixed bottom-[5.75rem] right-[max(1rem,calc(50vw-215px+1rem))] z-30 grid size-14 place-items-center rounded-full bg-eat text-ink shadow-lg"
        aria-label="Log food"
      >
        <Plus size={26} />
      </button>

      <Sheet open={chooser === "menu"} title="Log food" onClose={() => setChooser("closed")}>
        <div className="grid grid-cols-2 gap-3">
          <LogMode icon={<Search size={18} />} label="Search" onClick={() => setChooser("search")} />
          <LogMode
            icon={<ScanLine size={18} />}
            label="Barcode scan"
            onClick={() => {
              setChooser("closed");
              setBarcodeOpen(true);
            }}
          />
          <LogMode
            icon={<Camera size={18} />}
            label="Meal scan"
            onClick={() => {
              setChooser("closed");
              setScanOpen(true);
            }}
          />
          <LogMode icon={<Plus size={18} />} label="Quick add" onClick={() => setChooser("quick")} />
        </div>
      </Sheet>

      <Sheet open={chooser === "search"} title="Search food" onClose={() => setChooser("closed")}>
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
        <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs ${category === null ? "bg-eat text-ink" : "bg-card text-fog"}`}
          >
            All
          </button>
          {foodCategories().map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                category === cat ? "bg-eat text-ink" : "bg-card text-fog"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="mb-3 max-h-44 space-y-1 overflow-y-auto">
          {results.slice(0, 14).map((food) => {
            const fav = state.favoriteFoodIds.includes(food.id);
            return (
              <div
                key={food.id}
                className={`flex items-center gap-2 rounded-2xl px-2 py-1 ${
                  selectedId === food.id ? "bg-life/15" : "bg-card"
                }`}
              >
                <button type="button" className="flex-1 py-2 text-left" onClick={() => setSelectedId(food.id)}>
                  <p>{food.name}</p>
                  <p className="text-xs text-fog">
                    {food.category}
                    {food.brand ? ` · ${food.brand}` : ""} · {food.per100g.calories} kcal/100g
                  </p>
                </button>
                <button
                  type="button"
                  aria-label={fav ? "Remove favorite" : "Add favorite"}
                  onClick={() => toggleFavoriteFood(food.id)}
                  className={fav ? "text-eat" : "text-fog"}
                >
                  <Star size={16} fill={fav ? "currentColor" : "none"} />
                </button>
              </div>
            );
          })}
        </div>
        {selected ? (
          <>
            <p className="mb-2 text-sm font-medium">{selected.name}</p>
            <PortionStepper grams={grams} onChange={setGrams} />
            {preview ? (
              <p className="mt-3 text-sm text-fog">
                {preview.calories} kcal · P{preview.protein} C{preview.carbs} F{preview.fat}
              </p>
            ) : null}
          </>
        ) : null}
        <button type="button" onClick={saveSearch} className="mt-4 w-full rounded-2xl bg-eat py-3 font-semibold text-ink">
          Add to {meal}
        </button>
      </Sheet>

      <Sheet open={chooser === "quick"} title="Quick add" onClose={() => setChooser("closed")}>
        <p className="mb-3 text-sm text-fog">MyFitnessPal-style: calories and macros only. No food database needed.</p>
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
        <label className="mb-3 block text-sm text-fog">
          Name
          <input
            value={quickName}
            onChange={(event) => setQuickName(event.target.value)}
            placeholder="Late-night snack"
            className="mt-1 w-full rounded-2xl border border-line bg-card px-3 py-3 outline-none"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <QuickField label="Calories" value={quickCal} onChange={setQuickCal} />
          <QuickField label="Protein (g)" value={quickP} onChange={setQuickP} />
          <QuickField label="Carbs (g)" value={quickC} onChange={setQuickC} />
          <QuickField label="Fat (g)" value={quickF} onChange={setQuickF} />
        </div>
        <button type="button" onClick={saveQuick} className="mt-4 w-full rounded-2xl bg-eat py-3 font-semibold text-ink">
          Log macros
        </button>
      </Sheet>

      <BarcodeSheet open={barcodeOpen} onClose={() => setBarcodeOpen(false)} onScan={handleBarcode} />
      <MealScanSheet
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onConfirm={(scanned) => {
          for (const item of scanned.items) {
            logFoodItem({ foodId: item.foodId, grams: item.grams, meal, date: viewDate });
          }
        }}
      />

      <p className="flex items-center justify-center gap-1 text-center text-xs text-fog">
        <Barcode size={12} />
        Tap + to search, scan, meal-scan, or quick-add
      </p>
    </div>
  );
}

function LogMode({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-3xl bg-card px-3 py-5 text-center">
      <div className="mb-2 flex justify-center text-eat">{icon}</div>
      <p className="text-sm font-medium">{label}</p>
    </button>
  );
}

function WeightChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ink px-2 py-3">
      <p className="text-[10px] uppercase tracking-wide text-fog">{label}</p>
      <p className="font-mono text-lg">{value}</p>
    </div>
  );
}

function QuickField({
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
