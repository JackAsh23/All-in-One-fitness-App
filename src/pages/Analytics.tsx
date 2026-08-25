import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Heatmap";
import { MonthCalendar } from "../components/MonthCalendar";
import { SparkBars, SparkLine } from "../components/SparkBars";
import {
  exercisePersonalRecords,
  macroAdherence,
  muscleGroupFrequency,
  nutritionWeeklyAverages,
  paceTrend,
  racePrediction,
  runPersonalRecords,
  strengthProgression,
  topLiftExercise,
  trainingLoad,
  weeklyRunKm,
  weeklyWorkoutVolume,
  weightStats,
} from "../lib/analytics";
import { todayISO } from "../lib/dates";
import { logWeight, useAppState } from "../lib/store";

type Tab = "run" | "lift" | "eat" | "weight";

function formatPaceSec(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

function fmtDelta(n: number | null) {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n} kg`;
}

function deltaClass(n: number | null) {
  if (n == null) return "";
  return n <= 0 ? "text-life" : "text-run";
}

export function AnalyticsPage() {
  const state = useAppState();
  const [tab, setTab] = useState<Tab>("run");

  const mileage = weeklyRunKm(state.runs);
  const paces = paceTrend(state.runs);
  const prs = runPersonalRecords(state.runs);
  const load = trainingLoad(state.runs);
  const predictions = racePrediction(state.runs);
  const volume = weeklyWorkoutVolume(state.workouts);
  const liftPrs = exercisePersonalRecords(state.workouts);
  const muscles = muscleGroupFrequency(state.workouts);
  const focusLift = topLiftExercise(state.workouts);
  const liftTrend = strengthProgression(state.workouts, focusLift);
  const nutritionWeeks = nutritionWeeklyAverages(state);
  const adherence = macroAdherence(state);
  const weight = weightStats(state);
  const [weighIn, setWeighIn] = useState(String(weight.current ?? 76));
  const [weighDate, setWeighDate] = useState(todayISO());

  return (
    <div className="space-y-4 animate-pop">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-life">Phase 5</p>
          <h2 className="text-2xl font-semibold">Analytics</h2>
        </div>
        <Link to="/consistency" className="text-sm text-fog">
          Heatmaps
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-card p-1">
        {(
          [
            ["run", "Run"],
            ["lift", "Lift"],
            ["eat", "Eat"],
            ["weight", "Weight"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-xl py-2 text-sm font-medium ${
              tab === id ? "bg-life text-ink" : "text-fog"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "run" ? (
        <>
          <Card>
            <h3 className="mb-3 font-semibold">Weekly mileage</h3>
            <SparkBars data={mileage} unit="km" color="#ff6b4a" />
          </Card>
          <Card>
            <h3 className="mb-1 font-semibold">Pace trend</h3>
            <p className="mb-3 text-xs text-fog">Last {paces.length} runs — lower is faster</p>
            <SparkLine
              points={paces.map((p) => ({ label: p.label, value: p.paceSec }))}
              color="#ff6b4a"
              invertBetter
              formatValue={formatPaceSec}
            />
          </Card>
          <Card>
            <h3 className="mb-3 font-semibold">Training load</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-ink px-2 py-3">
                <p className="text-xs text-fog">This week</p>
                <p className="font-mono text-lg">{load.thisWeek} km</p>
              </div>
              <div className="rounded-2xl bg-ink px-2 py-3">
                <p className="text-xs text-fog">Last week</p>
                <p className="font-mono text-lg">{load.lastWeek} km</p>
              </div>
              <div className="rounded-2xl bg-ink px-2 py-3">
                <p className="text-xs text-fog">Status</p>
                <p className="text-sm font-medium text-life">{load.status}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-fog">
              Week-over-week {load.delta >= 0 ? "+" : ""}
              {load.delta}%
            </p>
          </Card>
          <Card>
            <h3 className="mb-3 font-semibold">Personal records</h3>
            <ul className="space-y-2">
              {prs.map((pr) => (
                <li key={pr.label} className="flex justify-between rounded-2xl bg-ink px-3 py-2">
                  <span className="text-fog">{pr.label}</span>
                  <span className="font-mono">{pr.value}</span>
                </li>
              ))}
            </ul>
          </Card>
          {predictions.length > 0 ? (
            <Card>
              <h3 className="mb-3 font-semibold">Race predictions</h3>
              <p className="mb-2 text-xs text-fog">Based on your best recent 5K (Riegel formula)</p>
              <ul className="space-y-2">
                {predictions.map((item) => (
                  <li key={item.distance} className="flex justify-between rounded-2xl bg-ink px-3 py-2">
                    <span>{item.distance}</span>
                    <span className="font-mono">{item.time}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      ) : null}

      {tab === "lift" ? (
        <>
          <Card>
            <h3 className="mb-3 font-semibold">Weekly volume</h3>
            <p className="mb-2 text-xs text-fog">Total kg moved (sets × reps × weight)</p>
            <SparkBars data={volume} unit="kg" color="#7aa6ff" />
          </Card>
          <Card>
            <h3 className="mb-1 font-semibold">{focusLift} progression</h3>
            <p className="mb-3 text-xs text-fog">Max weight per week</p>
            <SparkBars data={liftTrend} unit="kg" color="#7aa6ff" />
          </Card>
          <Card>
            <h3 className="mb-3 font-semibold">Muscle group frequency</h3>
            <ul className="space-y-2">
              {muscles.map((item) => (
                <li key={item.group}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{item.group}</span>
                    <span className="font-mono text-fog">{item.sets} sets</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink">
                    <div
                      className="h-full rounded-full bg-lift"
                      style={{ width: `${(item.sets / Math.max(muscles[0]?.sets ?? 1, 1)) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3 className="mb-3 font-semibold">Exercise PRs</h3>
            <ul className="space-y-2">
              {liftPrs.map((pr) => (
                <li key={pr.name} className="flex justify-between rounded-2xl bg-ink px-3 py-2 text-sm">
                  <span className="truncate pr-2">{pr.name}</span>
                  <span className="shrink-0 font-mono">
                    {pr.kg}kg × {pr.reps}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}

      {tab === "eat" ? (
        <>
          <Card>
            <h3 className="mb-3 font-semibold">Weekly calorie average</h3>
            <SparkBars
              data={nutritionWeeks.map((w) => ({ label: w.label, value: w.calories }))}
              unit=""
              color="#ffc857"
            />
            <p className="mt-2 text-xs text-fog">Goal: {state.profile.calorieGoal} kcal/day</p>
          </Card>
          <Card>
            <h3 className="mb-3 font-semibold">Protein consistency</h3>
            <SparkBars
              data={nutritionWeeks.map((w) => ({ label: w.label, value: w.protein }))}
              unit="g"
              color="#3ee07f"
            />
            <p className="mt-2 text-xs text-fog">Goal: {state.profile.proteinGoal}g/day</p>
          </Card>
          <Card>
            <h3 className="mb-3 font-semibold">Macro adherence (30 days)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-ink px-3 py-3 text-center">
                <p className="text-xs text-fog">Protein goal days</p>
                <p className="font-mono text-2xl text-life">{adherence.proteinRate}%</p>
              </div>
              <div className="rounded-2xl bg-ink px-3 py-3 text-center">
                <p className="text-xs text-fog">Calorie on-target</p>
                <p className="font-mono text-2xl text-eat">{adherence.calorieRate}%</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-fog">{adherence.daysLogged} days logged in the window</p>
          </Card>
        </>
      ) : null}

      {tab === "weight" ? (
        <>
          <Card className="bg-gradient-to-br from-step/10 to-card">
            <p className="text-xs uppercase tracking-[0.18em] text-step">Current</p>
            <p className="font-mono text-5xl font-semibold">{weight.current ?? "—"}</p>
            <p className="text-sm text-fog">kg</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-ink px-2 py-3">
                <p className="text-[10px] uppercase text-fog">Start</p>
                <p className="font-mono">{weight.start ?? "—"}</p>
              </div>
              <div className="rounded-2xl bg-ink px-2 py-3">
                <p className="text-[10px] uppercase text-fog">Target</p>
                <p className="font-mono">{weight.target ?? "—"}</p>
              </div>
              <div className="rounded-2xl bg-ink px-2 py-3">
                <p className="text-[10px] uppercase text-fog">Left</p>
                <p className="font-mono">
                  {weight.remaining == null ? "—" : `${weight.remaining > 0 ? "" : "+"}${weight.remaining}`}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink">
              <div className="h-full rounded-full bg-step" style={{ width: `${weight.progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-fog">
              {weight.lost == null ? "Log a weigh-in to start the trend." : `${weight.lost >= 0 ? "Down" : "Up"} ${Math.abs(weight.lost)} kg from start · ${weight.progress}% to target`}
            </p>
          </Card>
          <Card>
            <h3 className="mb-3 font-semibold">Trend</h3>
            <SparkLine
              points={weight.points}
              color="#5eead4"
              invertBetter
              formatValue={(v) => `${v.toFixed(1)} kg`}
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-ink px-3 py-3">
                <p className="text-xs text-fog">7-day change</p>
                <p className={`font-mono text-lg ${deltaClass(weight.weekChange)}`}>
                  {fmtDelta(weight.weekChange)}
                </p>
              </div>
              <div className="rounded-2xl bg-ink px-3 py-3">
                <p className="text-xs text-fog">30-day change</p>
                <p className={`font-mono text-lg ${deltaClass(weight.monthChange)}`}>
                  {fmtDelta(weight.monthChange)}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="mb-3 font-semibold">Weigh-in calendar</h3>
            <MonthCalendar
              selected={weighDate}
              marked={weight.logs.map((entry) => entry.date)}
              onSelect={setWeighDate}
              accent="bg-step text-ink"
            />
            <div className="mt-3 flex gap-2">
              <input
                value={weighIn}
                onChange={(event) => setWeighIn(event.target.value)}
                className="flex-1 rounded-2xl border border-line bg-ink px-3 py-3"
                inputMode="decimal"
              />
              <button
                type="button"
                className="rounded-2xl bg-step px-4 py-3 font-semibold text-ink"
                onClick={() => logWeight(weighDate, Number(weighIn))}
              >
                Log kg
              </button>
            </div>
            <p className="mt-2 text-xs text-fog">
              {weight.logs.find((entry) => entry.date === weighDate)
                ? `${weight.logs.find((entry) => entry.date === weighDate)?.kg} kg on this day`
                : "No weigh-in on this day yet"}
            </p>
          </Card>
        </>
      ) : null}
    </div>
  );
}
