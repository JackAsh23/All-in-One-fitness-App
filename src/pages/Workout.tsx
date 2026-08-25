import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp, Images, Plus, Timer } from "lucide-react";
import { BackButton } from "../components/BackButton";
import { Card } from "../components/Heatmap";
import { ExerciseArt } from "../components/ExerciseArt";
import { Sheet } from "../components/Sheet";
import { GUIDE_MUSCLES, searchGuideExercises } from "../lib/exerciseArt";
import { EXERCISE_CATALOG, TEMPLATES } from "../lib/exercises";
import { formatShortDate, nowTime, todayISO, uid, weekdayIndex } from "../lib/dates";
import { addWorkout, useAppState } from "../lib/store";
import { TRAINING_PLANS, type PlanDay, type TrainingPlan } from "../lib/trainingPlans";
import type { WorkoutExercise } from "../lib/types";

const REST_DEFAULT = 90;

export function WorkoutPage() {
  const state = useAppState();
  const location = useLocation();
  const [session, setSession] = useState<null | { template: string; exercises: WorkoutExercise[]; started: number }>(
    null,
  );
  const [rest, setRest] = useState(0);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [kg, setKg] = useState("20");
  const [reps, setReps] = useState("10");
  const [activeExercise, setActiveExercise] = useState(0);
  const [planId, setPlanId] = useState(TRAINING_PLANS[0].id);
  const [planOpen, setPlanOpen] = useState(true);

  useEffect(() => {
    if (rest <= 0) return;
    const id = window.setInterval(() => setRest((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [rest]);

  const history = useMemo(
    () => [...state.workouts].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
    [state.workouts],
  );

  const plan = TRAINING_PLANS.find((item) => item.id === planId) ?? TRAINING_PLANS[0];
  const todayDow = weekdayIndex(todayISO());
  const todayDay = plan.days.find((day) => day.weekday === todayDow) ?? null;

  useEffect(() => {
    const startExercise = (location.state as { startExercise?: string } | null)?.startExercise;
    if (!startExercise) return;
    startExercises("Custom Workout", [{ name: startExercise, sets: [] }]);
    window.history.replaceState({}, "");
  }, [location.state]);

  function startExercises(template: string, exercises: WorkoutExercise[]) {
    setSession({ template, started: Date.now(), exercises });
    setActiveExercise(0);
    if (exercises[0]?.targetReps) {
      const n = Number.parseInt(exercises[0].targetReps, 10);
      if (Number.isFinite(n)) setReps(String(n));
    }
  }

  function startTemplate(id: string) {
    const template = TEMPLATES.find((item) => item.id === id);
    if (!template) return;
    startExercises(
      template.name,
      template.exercises.map((name) => ({ name, sets: [] })),
    );
  }

  function startPlanDay(day: PlanDay, fromPlan: TrainingPlan) {
    startExercises(
      `${fromPlan.name} · ${day.title}`,
      day.exercises.map((exercise) => ({
        name: exercise.name,
        sets: [],
        targetSets: exercise.sets,
        targetReps: exercise.reps,
      })),
    );
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
      exercises: session.exercises.filter(
        (exercise) => exercise.sets.length > 0 || session.template === "Custom Workout",
      ),
    });
    setSession(null);
    setRest(0);
  }

  const monthWorkouts = state.workouts.filter((workout) => workout.date.startsWith(todayISO().slice(0, 7))).length;
  const guideHits = searchGuideExercises(customName, muscle);
  const catalogHits = EXERCISE_CATALOG.filter((name) => name.toLowerCase().includes(customName.toLowerCase()));

  if (session) {
    const current = session.exercises[activeExercise];
    return (
      <div className="space-y-4 animate-pop">
        <div className="space-y-3">
          <BackButton
            fallback="/workout"
            className="w-full"
            onClick={() => {
              setSession(null);
              setRest(0);
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-lift">Live session</p>
              <h2 className="truncate text-2xl font-semibold">{session.template}</h2>
            </div>
            <button type="button" onClick={finish} className="shrink-0 rounded-full bg-life px-4 py-2 text-sm font-semibold text-ink">
              Finish
            </button>
          </div>
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
              onClick={() => {
                setActiveExercise(index);
                if (exercise.targetReps) {
                  const n = Number.parseInt(exercise.targetReps, 10);
                  if (Number.isFinite(n)) setReps(String(n));
                }
              }}
              className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm ${
                index === activeExercise ? "bg-lift text-ink" : "bg-card text-fog"
              }`}
            >
              <ExerciseArt name={exercise.name} size={28} className="rounded-full" />
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
            <div className="mb-3 flex gap-3">
              <ExerciseArt name={current.name} size={96} />
              <div>
                <h3 className="font-semibold">{current.name}</h3>
                {current.targetSets ? (
                  <p className="mt-1 text-sm text-lift">
                    Prescription: {current.targetSets} × {current.targetReps}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-fog">Tap the image to cycle poses.</p>
                )}
                <p className="mt-2 font-mono text-sm text-fog">
                  {current.sets.length}
                  {current.targetSets ? ` / ${current.targetSets}` : ""} sets logged
                </p>
              </div>
            </div>
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

        <AddExerciseSheet
          open={customOpen}
          query={customName}
          muscle={muscle}
          hits={guideHits.length ? guideHits : catalogHits.map((name) => ({ slug: name, name, muscle: "", equipment: "" }))}
          muscles={GUIDE_MUSCLES}
          onQuery={setCustomName}
          onMuscle={setMuscle}
          onClose={() => setCustomOpen(false)}
          onPick={addExercise}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-pop">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold">Workout</h2>
        <div className="flex items-center gap-3">
          <Link to="/workout/gallery" className="flex items-center gap-1 text-sm text-lift">
            <Images size={14} />
            Gallery
          </Link>
          <p className="text-sm text-fog">{monthWorkouts} this month</p>
        </div>
      </div>

      <Link
        to="/workout/gallery"
        className="block rounded-3xl border border-lift/40 bg-lift/10 px-4 py-4"
      >
        <p className="text-xs uppercase tracking-[0.18em] text-lift">@bryllim/workout-guide</p>
        <p className="mt-1 font-semibold">Exercise gallery · 302 PNG guides</p>
        <p className="mt-1 text-sm text-fog">Filter by muscle and equipment, preview 3 frames, start a set.</p>
      </Link>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Training plan</h3>
            <p className="mt-1 text-xs text-fog">{plan.name}</p>
          </div>
          <button
            type="button"
            onClick={() => setPlanOpen((open) => !open)}
            className="flex shrink-0 items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-sm text-fog"
          >
            {planOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {planOpen ? "Hide" : "Show"}
          </button>
        </div>
        {planOpen ? (
          <>
            <p className="mt-3 mb-3 text-xs text-fog">{plan.blurb}</p>
            <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
              {TRAINING_PLANS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlanId(item.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                    planId === item.id ? "bg-lift text-ink" : "bg-ink text-fog"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {plan.days.map((day) => {
                const isToday = day.weekday === todayDow;
                return (
                  <button
                    key={`${plan.id}-${day.weekday}`}
                    type="button"
                    onClick={() => startPlanDay(day, plan)}
                    className={`w-full rounded-2xl px-3 py-3 text-left ${
                      isToday ? "bg-lift/15 ring-1 ring-lift" : "bg-ink"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {day.label} · {day.title}
                      </p>
                      {isToday ? <span className="text-xs text-lift">Today</span> : null}
                    </div>
                    <p className="text-xs text-fog">{day.focus}</p>
                    <ul className="mt-2 space-y-1">
                      {day.exercises.map((exercise) => (
                        <li key={exercise.name} className="flex items-center gap-2 text-sm">
                          <ExerciseArt name={exercise.name} size={36} className="rounded-xl" />
                          <span className="flex-1">{exercise.name}</span>
                          <span className="font-mono text-xs text-fog">
                            {exercise.sets}×{exercise.reps}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-fog">
            {todayDay ? `Today: ${todayDay.title} · ${todayDay.focus}` : "Rest day on this plan."}
          </p>
        )}
        {todayDay ? (
          <button
            type="button"
            onClick={() => startPlanDay(todayDay, plan)}
            className="mt-3 w-full rounded-2xl bg-lift py-3 font-semibold text-ink"
          >
            Start today · {todayDay.title}
          </button>
        ) : planOpen ? (
          <p className="mt-3 text-center text-sm text-fog">Rest day on this plan. Pick another session above.</p>
        ) : null}
      </Card>

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
      <p className="px-1 text-center text-[11px] text-fog">
        Exercise art by Bryl Lim / Everkinetic, CC BY-SA 4.0 · @bryllim/workout-guide
      </p>
    </div>
  );
}

function AddExerciseSheet({
  open,
  query,
  muscle,
  hits,
  muscles,
  onQuery,
  onMuscle,
  onClose,
  onPick,
}: {
  open: boolean;
  query: string;
  muscle: string | null;
  hits: { slug: string; name: string; muscle: string; equipment: string }[];
  muscles: string[];
  onQuery: (value: string) => void;
  onMuscle: (value: string | null) => void;
  onClose: () => void;
  onPick: (name: string) => void;
}) {
  return (
    <Sheet open={open} title="Add exercise" onClose={onClose}>
      <input
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder="Search pull-up, squat, chest…"
        className="mb-3 w-full rounded-2xl border border-line bg-card px-3 py-3 outline-none"
      />
      <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => onMuscle(null)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs ${muscle === null ? "bg-lift text-ink" : "bg-card text-fog"}`}
        >
          All
        </button>
        {muscles.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onMuscle(item)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs ${
              muscle === item ? "bg-lift text-ink" : "bg-card text-fog"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {hits.slice(0, 20).map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => onPick(item.name)}
            className="flex w-full items-center gap-3 rounded-2xl bg-card px-2 py-2 text-left"
          >
            <ExerciseArt name={item.name} size={52} />
            <span>
              <p>{item.name}</p>
              <p className="text-xs text-fog">
                {item.muscle}
                {item.equipment ? ` · ${item.equipment}` : ""}
              </p>
            </span>
          </button>
        ))}
        {query.trim() ? (
          <button type="button" onClick={() => onPick(query)} className="w-full rounded-2xl bg-life px-3 py-3 text-ink">
            Use “{query}”
          </button>
        ) : null}
      </div>
    </Sheet>
  );
}
