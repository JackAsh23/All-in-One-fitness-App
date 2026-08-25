import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Heatmap";
import { GOAL_MODES } from "../lib/goalModes";
import { defaultPriorities } from "../lib/scoring";
import { downloadBackup, importBackup, resetDemo, setGoalMode, updateProfile, useAppState } from "../lib/store";
import type { Priorities } from "../lib/types";

export function ProfilePage() {
  const state = useAppState();
  const [name, setName] = useState(state.profile.name);
  const [calorieGoal, setCalorieGoal] = useState(String(state.profile.calorieGoal));
  const [proteinGoal, setProteinGoal] = useState(String(state.profile.proteinGoal));
  const [carbGoal, setCarbGoal] = useState(String(state.profile.carbGoal));
  const [fatGoal, setFatGoal] = useState(String(state.profile.fatGoal));
  const [stepGoal, setStepGoal] = useState(String(state.profile.stepGoal));
  const [startWeight, setStartWeight] = useState(String(state.profile.startWeightKg ?? 78));
  const [currentWeight, setCurrentWeight] = useState(String(state.profile.currentWeightKg ?? 76));
  const [targetWeight, setTargetWeight] = useState(String(state.profile.targetWeightKg ?? 74));
  const [priorities, setPriorities] = useState<Priorities>(state.profile.priorities);
  const [saved, setSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  function save() {
    updateProfile({
      name: name.trim() || "Jack",
      calorieGoal: Number(calorieGoal) || 1900,
      proteinGoal: Number(proteinGoal) || 140,
      carbGoal: Number(carbGoal) || 220,
      fatGoal: Number(fatGoal) || 60,
      stepGoal: Number(stepGoal) || 10000,
      startWeightKg: Number(startWeight) || undefined,
      currentWeightKg: Number(currentWeight) || undefined,
      targetWeightKg: Number(targetWeight) || undefined,
      priorities,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className="space-y-4 animate-pop">
      <h2 className="text-2xl font-semibold">Profile</h2>
      <Link
        to="/integrations"
        className="block rounded-3xl border border-step/40 bg-step/10 px-4 py-3 text-sm text-step"
      >
        Connected apps & auto-sync →
      </Link>
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
          <Num label="Start kg" value={startWeight} onChange={setStartWeight} />
          <Num label="Current kg" value={currentWeight} onChange={setCurrentWeight} />
          <Num label="Target kg" value={targetWeight} onChange={setTargetWeight} />
        </div>
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold">Consistency OS mode</h3>
        <div className="space-y-2">
          {GOAL_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                setGoalMode(mode.id);
                setPriorities(mode.priorities);
              }}
              className={`w-full rounded-2xl px-3 py-3 text-left ${
                state.profile.goalMode === mode.id ? "bg-life/15 ring-1 ring-life" : "bg-ink"
              }`}
            >
              <p className="font-medium">
                {mode.emoji} {mode.label}
              </p>
              <p className="text-xs text-fog">{mode.blurb}</p>
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="mb-3 font-semibold">Score pillars (manual)</h3>
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
      <Card>
        <h3 className="mb-2 font-semibold">Backup data</h3>
        <p className="text-sm text-fog">
          Export everything (runs, workouts, food log, weight) as a JSON file. Import on a new phone or after clearing
          Safari data.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => downloadBackup()}
            className="w-full rounded-2xl border border-life/40 bg-life/10 py-3 font-medium text-life"
          >
            Export backup
          </button>
          <label className="block w-full cursor-pointer rounded-2xl border border-line py-3 text-center text-sm text-snow">
            Import backup
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                file.text().then((raw) => {
                  const result = importBackup(raw);
                  if (result.ok) {
                    setImportStatus("Backup restored.");
                    window.setTimeout(() => setImportStatus(null), 2400);
                  } else {
                    window.alert(result.error);
                  }
                });
              }}
            />
          </label>
          {importStatus ? <p className="text-center text-sm text-life">{importStatus}</p> : null}
        </div>
      </Card>
      <button
        type="button"
        onClick={resetDemo}
        className="w-full rounded-3xl border border-line py-3 text-fog"
      >
        Reload demo year
      </button>
      <p className="px-1 text-center text-xs text-fog">
        One Life v1.1 — GPS runs, training plans, smarter food log. Data stays in this browser.
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
