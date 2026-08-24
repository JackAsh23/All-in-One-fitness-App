import { useState } from "react";
import { Card } from "../components/Heatmap";
import { defaultPriorities } from "../lib/scoring";
import { resetDemo, updateProfile, useAppState } from "../lib/store";
import type { Priorities } from "../lib/types";

export function ProfilePage() {
  const state = useAppState();
  const [name, setName] = useState(state.profile.name);
  const [calorieGoal, setCalorieGoal] = useState(String(state.profile.calorieGoal));
  const [proteinGoal, setProteinGoal] = useState(String(state.profile.proteinGoal));
  const [carbGoal, setCarbGoal] = useState(String(state.profile.carbGoal));
  const [fatGoal, setFatGoal] = useState(String(state.profile.fatGoal));
  const [stepGoal, setStepGoal] = useState(String(state.profile.stepGoal));
  const [priorities, setPriorities] = useState<Priorities>(state.profile.priorities);
  const [saved, setSaved] = useState(false);

  function save() {
    updateProfile({
      name: name.trim() || "Jack",
      calorieGoal: Number(calorieGoal) || 1900,
      proteinGoal: Number(proteinGoal) || 140,
      carbGoal: Number(carbGoal) || 220,
      fatGoal: Number(fatGoal) || 60,
      stepGoal: Number(stepGoal) || 10000,
      priorities,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className="space-y-4 animate-pop">
      <h2 className="text-2xl font-semibold">Profile</h2>
      <Card>
        <p className="text-sm text-fog">
          The heatmap and score follow your priorities. A marathon block shouldn’t punish missed bench days.
        </p>
        <label className="mt-4 block text-sm text-fog">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-line bg-ink px-3 py-3 text-snow"
          />
        </label>
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold">Daily targets</h3>
        <div className="grid grid-cols-2 gap-3">
          <Num label="Calories" value={calorieGoal} onChange={setCalorieGoal} />
          <Num label="Protein (g)" value={proteinGoal} onChange={setProteinGoal} />
          <Num label="Carbs (g)" value={carbGoal} onChange={setCarbGoal} />
          <Num label="Fat (g)" value={fatGoal} onChange={setFatGoal} />
          <Num label="Steps" value={stepGoal} onChange={setStepGoal} />
        </div>
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold">Score priorities</h3>
        {(
          [
            ["running", "Running"],
            ["strength", "Strength"],
            ["nutrition", "Nutrition"],
            ["steps", "Steps"],
            ["mobility", "Mobility"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="mb-2 flex items-center justify-between rounded-2xl bg-ink px-3 py-3">
            <span>{label}</span>
            <input
              type="checkbox"
              checked={priorities[key]}
              onChange={(event) => setPriorities({ ...priorities, [key]: event.target.checked })}
              className="size-4 accent-life"
            />
          </label>
        ))}
        <button
          type="button"
          className="mt-2 text-sm text-fog"
          onClick={() => setPriorities(defaultPriorities())}
        >
          Reset priorities
        </button>
      </Card>
      <button type="button" onClick={save} className="w-full rounded-3xl bg-life py-3 font-semibold text-ink">
        {saved ? "Saved" : "Save profile"}
      </button>
      <button
        type="button"
        onClick={resetDemo}
        className="w-full rounded-3xl border border-line py-3 text-fog"
      >
        Reload demo year
      </button>
      <p className="px-1 text-center text-xs text-fog">
        Prototype of One Life — v0.1 tracker + v0.2 consistency heatmaps. Data stays in this browser.
      </p>
    </div>
  );
}

function Num({
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
        className="mt-1 w-full rounded-2xl border border-line bg-ink px-3 py-3 text-snow"
        inputMode="numeric"
      />
    </label>
  );
}
