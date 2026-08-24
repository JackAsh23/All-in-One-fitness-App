import { useEffect, useMemo, useState } from "react";
import { Plus, Timer } from "lucide-react";
import { Card } from "../components/Heatmap";
import { Sheet } from "../components/Sheet";
import { EXERCISE_CATALOG, TEMPLATES } from "../lib/exercises";
import { formatShortDate, nowTime, todayISO, uid } from "../lib/dates";
import { addWorkout, useAppState } from "../lib/store";
import type { WorkoutExercise } from "../lib/types";

const REST_DEFAULT = 90;

export function WorkoutPage() {
  const state = useAppState();
  const [session, setSession] = useState<null | { template: string; exercises: WorkoutExercise[]; started: number }>(null);
  const [rest, setRest] = useState(0);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [kg, setKg] = useState("20");
  const [reps, setReps] = useState("10");
  const [activeExercise, setActiveExercise] = useState(0);

  useEffect(() => {
    if (rest <= 0) return;
    const id = window.setInterval(() => setRest((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [rest]);

  const history = useMemo(
    () => [...state.workouts].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
    [state.workouts],
  );

  function startTemplate(id: string) {
    const template = TEMPLATES.find((item) => item.id === id);
    if (!template) return;
    setSession({
      template: template.name,
      started: Date.now(),
      exercises: template.exercises.map((name) => ({ name, sets: [] })),
    });
    setActiveExercise(0);
  }

  function logSet() {
    if (!session) return;
    const next = structuredClone(session);
    const exercise = next.exercises[activeExercise];
    if (!exercise) return;
    exercise.sets.push({ kg: Number(kg) || 0, reps: Number(reps) || 0 });
    setSession(next);
    setRest(REST_DEFAULT);
  }

  function addExercise(name: string) {
    if (!session || !name.trim()) return;
    setSession({
      ...session,
      exercises: [...session.exercises, { name: name.trim(), sets: [] }],
    });
    setCustomOpen(false);
    setCustomName("");
    setActiveExercise(session.exercises.length);
  }

  function finish() {
    if (!session) return;
    const durationMin = Math.max(1, Math.round((Date.now() - session.started) / 60000));
    addWorkout({
      id: uid("wo"),
      date: todayISO(),
      time: nowTime(),
      template: session.template,
      durationMin,
      exercises: session.exercises.filter((exercise) => exercise.sets.length > 0 || session.template === "Custom Workout"),
    });
    setSession(null);
    setRest(0);
  }

  const monthWorkouts = state.workouts.filter((workout) => workout.date.startsWith(todayISO().slice(0, 7))).length;

  if (session) {
    const current = session.exercises[activeExercise];
    return (
      <div className="space-y-4 animate-pop">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-lift">Live session</p>
            <h2 className="text-2xl font-semibold">{session.template}</h2>
          </div>
          <button type="button" onClick={finish} className="rounded-full bg-life px-4 py-2 text-sm font-semibold text-ink">
            Finish
          </button>
        </div>

        {rest > 0 ? (
          <Card className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-life">
              <Timer size={16} />
              Rest timer
            </div>
            <p className="font-mono text-3xl">{rest}s</p>
          </Card>
        ) : null}

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {session.exercises.map((exercise, index) => (
            <button
              key={`${exercise.name}-${index}`}
              type="button"
              onClick={() => setActiveExercise(index)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                index === activeExercise ? "bg-lift text-ink" : "bg-card text-fog"
              }`}
            >
              {exercise.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-card text-fog"
          >
            <Plus size={16} />
          </button>
        </div>

        {current ? (
          <Card>
            <h3 className="mb-3 font-semibold">{current.name}</h3>
            {current.sets.length === 0 ? (
              <p className="mb-3 text-sm text-fog">No sets yet. Log the first one.</p>
            ) : (
              <ul className="mb-4 space-y-2">
                {current.sets.map((set, index) => (
                  <li key={index} className="flex justify-between rounded-2xl bg-ink px-3 py-2 font-mono text-sm">
                    <span>Set {index + 1}</span>
                    <span>
                      {set.kg}kg × {set.reps}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-fog">
                kg
                <input
                  value={kg}
                  onChange={(event) => setKg(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-line bg-ink px-3 py-3 text-snow"
                  inputMode="decimal"
                />
              </label>
              <label className="text-sm text-fog">
                reps
                <input
                  value={reps}
                  onChange={(event) => setReps(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-line bg-ink px-3 py-3 text-snow"
                  inputMode="numeric"
                />
              </label>
            </div>
            <button type="button" onClick={logSet} className="mt-3 w-full rounded-2xl bg-lift py-3 font-semibold text-ink">
              Log set
            </button>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-fog">Add an exercise to start logging sets.</p>
            <button type="button" className="mt-3 rounded-2xl bg-lift px-4 py-2 text-ink" onClick={() => setCustomOpen(true)}>
              Add exercise
            </button>
          </Card>
        )}

        <Sheet open={customOpen} title="Add exercise" onClose={() => setCustomOpen(false)}>
          <input
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            placeholder="Search or type a name"
            className="mb-3 w-full rounded-2xl border border-line bg-card px-3 py-3 outline-none"
          />
          <div className="space-y-2">
            {EXERCISE_CATALOG.filter((name) => name.toLowerCase().includes(customName.toLowerCase()))
              .slice(0, 12)
              .map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => addExercise(name)}
                  className="w-full rounded-2xl bg-card px-3 py-3 text-left"
                >
                  {name}
                </button>
              ))}
            {customName.trim() ? (
              <button
                type="button"
                onClick={() => addExercise(customName)}
                className="w-full rounded-2xl bg-life px-3 py-3 text-ink"
              >
                Use “{customName}”
              </button>
            ) : null}
          </div>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-pop">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold">Workout</h2>
        <p className="text-sm text-fog">{monthWorkouts} this month</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => startTemplate(template.id)}
            className="rounded-3xl border border-line bg-card p-4 text-left"
          >
            <p className="font-semibold">{template.name}</p>
            <p className="mt-1 text-xs text-fog">{template.blurb}</p>
          </button>
        ))}
      </div>
      <Card>
        <h3 className="mb-3 font-semibold">History</h3>
        <ul className="space-y-3">
          {history.slice(0, 10).map((workout) => {
            const sets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
            return (
              <li key={workout.id} className="rounded-2xl bg-ink px-3 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{workout.template}</p>
                  <p className="text-xs text-fog">{formatShortDate(workout.date)}</p>
                </div>
                <p className="text-sm text-fog">
                  {workout.exercises.length} exercises · {sets} sets · {workout.durationMin} min
                </p>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
