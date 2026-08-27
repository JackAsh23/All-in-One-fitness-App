import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Images, Plus, Timer } from "lucide-react";
import { BackButton } from "../components/BackButton";
import { Card } from "../components/Heatmap";
import { ExerciseArt } from "../components/ExerciseArt";
import { Sheet } from "../components/Sheet";
import { GUIDE_MUSCLES, searchGuideExercises } from "../lib/exerciseArt";
import { EXERCISE_CATALOG, TEMPLATES } from "../lib/exercises";
import { formatShortDate, nowTime, todayISO, uid, weekdayIndex } from "../lib/dates";
import { addWorkout, removeCustomPlan, removeWorkout, saveCustomPlan, setTrainingPlan, updateProfile, useAppState } from "../lib/store";
import { TRAINING_PLANS, resolvePlan, type PlanDay, type TrainingPlan } from "../lib/trainingPlans";
import { formatWorkoutSet, isTimedExercise, parseTimedTarget, sessionHasLoggedSets } from "../lib/exerciseTiming";
import { showToast } from "../lib/toast";
import { CustomPlanSheet } from "../components/CustomPlanSheet";
import type { WorkoutExercise } from "../lib/types";

const REST_CHOICES = [30, 45, 60, 90, 120, 180];

export function WorkoutPage() {
  const state = useAppState();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [session, setSession] = useState<null | { template: string; exercises: WorkoutExercise[]; started: number }>(
    null,
  );
  const [rest, setRest] = useState(0);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [kg, setKg] = useState("20");
  const [reps, setReps] = useState("10");
  const [holdSec, setHoldSec] = useState("45");
  const [holdRemaining, setHoldRemaining] = useState(45);
  const [holdRunning, setHoldRunning] = useState(false);
  const [activeExercise, setActiveExercise] = useState(0);
  const [planOpen, setPlanOpen] = useState(true);
  const [planBuilderOpen, setPlanBuilderOpen] = useState(false);
  const restSec = state.profile.restSec ?? 90;
  const customPlans = state.customPlans ?? [];
  const plan = resolvePlan(state.trainingPlanId, customPlans);
  const todayDow = weekdayIndex(todayISO());
  const todayDay = plan?.days.find((day) => day.weekday === todayDow) ?? null;
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const activeRef = useRef(activeExercise);
  activeRef.current = activeExercise;
  const holdLoggedRef = useRef(false);
  const holdTarget = Math.max(1, Number(holdSec) || 45);

  useEffect(() => {
    if (rest <= 0) return;
    const id = window.setInterval(() => setRest((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [rest]);

  useEffect(() => {
    if (!holdRunning) return;
    const id = window.setInterval(() => {
      setHoldRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [holdRunning]);

  useEffect(() => {
    if (!holdRunning) {
      holdLoggedRef.current = false;
      return;
    }
    if (holdRemaining > 0 || holdLoggedRef.current) return;
    holdLoggedRef.current = true;
    logTimedSet(holdTarget);
  }, [holdRunning, holdRemaining, holdTarget]);

  const history = useMemo(
    () => [...state.workouts].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
    [state.workouts],
  );

  useEffect(() => {
    const startExercise = (location.state as { startExercise?: string } | null)?.startExercise;
    if (!startExercise) return;
    startExercises("Custom Workout", [{ name: startExercise, sets: [] }]);
    window.history.replaceState({}, "");
  }, [location.state]);

  useEffect(() => {
    if (searchParams.get("start") !== "1") return;
    setSearchParams({}, { replace: true });
    if (todayDay && plan) startPlanDay(todayDay, plan);
  }, []);

  function syncInputsFor(exercise?: WorkoutExercise) {
    setHoldRunning(false);
    if (!exercise) return;
    const timed = isTimedExercise(exercise.name, exercise.targetReps);
    const target = parseTimedTarget(exercise.targetReps);
    if (timed) {
      const seconds = target ?? 45;
      setHoldSec(String(seconds));
      setHoldRemaining(seconds);
    } else if (exercise.targetReps) {
      const n = Number.parseInt(exercise.targetReps, 10);
      if (Number.isFinite(n) && parseTimedTarget(exercise.targetReps) == null) setReps(String(n));
    }
  }

  function startExercises(template: string, exercises: WorkoutExercise[]) {
    setSession({ template, started: Date.now(), exercises });
    setActiveExercise(0);
    setRest(0);
    syncInputsFor(exercises[0]);
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

  function logTimedSet(seconds: number) {
    const currentSession = sessionRef.current;
    if (!currentSession || seconds <= 0) return;
    const next = structuredClone(currentSession);
    const exercise = next.exercises[activeRef.current];
    if (!exercise) return;
    exercise.sets.push({ kg: 0, reps: 0, durationSec: seconds });
    setSession(next);
    setHoldRunning(false);
    setHoldRemaining(holdTarget);
    setRest(restSec);
  }

  function logSet() {
    if (!session || holdRunning) return;
    const next = structuredClone(session);
    const exercise = next.exercises[activeExercise];
    if (!exercise) return;
    const timed = isTimedExercise(exercise.name, exercise.targetReps);
    if (timed) {
      const seconds = holdRemaining < holdTarget ? holdTarget - holdRemaining : holdTarget;
      if (!seconds) return;
      exercise.sets.push({ kg: 0, reps: 0, durationSec: seconds });
      setHoldRemaining(holdTarget);
    } else {
      exercise.sets.push({ kg: Number(kg) || 0, reps: Number(reps) || 0 });
    }
    setSession(next);
    setRest(restSec);
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
    syncInputsFor({ name: name.trim(), sets: [] });
  }

  function finish() {
    if (!session) return;
    if (!sessionHasLoggedSets(session.exercises)) {
      setSession(null);
      setRest(0);
      setHoldRunning(false);
      showToast("No sets logged");
      return;
    }
    const durationMin = Math.max(1, Math.round((Date.now() - session.started) / 60000));
    addWorkout({
      id: uid("wo"),
      date: todayISO(),
      time: nowTime(),
      template: session.template,
      durationMin,
      exercises: session.exercises.filter((exercise) => exercise.sets.length > 0),
    });
    setSession(null);
    setRest(0);
    setHoldRunning(false);
    showToast("Workout saved");
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
              setHoldRunning(false);
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
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-life">
                <Timer size={16} />
                Rest
              </div>
              <p className="font-mono text-3xl">{rest}s</p>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" className="flex-1 rounded-2xl bg-ink py-2 text-sm" onClick={() => setRest(0)}>
                Skip
              </button>
              <button type="button" className="flex-1 rounded-2xl bg-ink py-2 text-sm" onClick={() => setRest((value) => value + 15)}>
                +15s
              </button>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {REST_CHOICES.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => {
                    updateProfile({ restSec: seconds });
                    setRest(seconds);
                  }}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                    restSec === seconds ? "bg-lift text-ink" : "bg-ink text-fog"
                  }`}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </Card>
        ) : null}

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {session.exercises.map((exercise, index) => (
            <button
              key={`${exercise.name}-${index}`}
              type="button"
              onClick={() => {
                setActiveExercise(index);
                syncInputsFor(exercise);
              }}
              className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm ${
                index === activeExercise ? "bg-lift text-ink" : "bg-card text-fog"
              }`}
            >
              <ExerciseArt name={exercise.name} size={28} className="rounded-full" interactive={false} />
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
                      {formatWorkoutSet(set)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {isTimedExercise(current.name, current.targetReps) ? (
              <div className="space-y-3">
                <div className="rounded-3xl bg-ink px-4 py-6 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-lift">
                    {holdRunning ? "Hold" : "Ready"}
                  </p>
                  <p className="mt-1 font-mono text-6xl font-semibold tabular-nums">{holdRemaining}s</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-card">
                    <div
                      className="h-full rounded-full bg-lift transition-[width] duration-1000 ease-linear"
                      style={{
                        width: `${Math.min(100, Math.round(((holdTarget - holdRemaining) / holdTarget) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-fog">
                    {holdRunning ? "Logs automatically at 0" : `Target ${holdTarget}s`}
                  </p>
                </div>
                <label className="text-sm text-fog">
                  Target seconds
                  <input
                    value={holdSec}
                    disabled={holdRunning}
                    onChange={(event) => {
                      setHoldSec(event.target.value);
                      const next = Math.max(1, Number(event.target.value) || 45);
                      if (!holdRunning) setHoldRemaining(next);
                    }}
                    className="mt-1 w-full rounded-2xl border border-line bg-ink px-3 py-3 text-snow disabled:opacity-50"
                    inputMode="numeric"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="rounded-2xl bg-lift py-3 font-semibold text-ink disabled:opacity-40"
                    disabled={holdRunning}
                    onClick={() => {
                      setHoldRemaining(holdTarget);
                      setHoldRunning(true);
                    }}
                  >
                    Start timer
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl bg-card py-3 disabled:opacity-40"
                    disabled={!holdRunning}
                    onClick={() => {
                      setHoldRunning(false);
                      setHoldRemaining(holdTarget);
                    }}
                  >
                    Cancel
                  </button>
                </div>
                <button
                  type="button"
                  onClick={logSet}
                  disabled={holdRunning}
                  className="w-full rounded-2xl bg-lift/20 py-3 font-semibold text-lift disabled:opacity-40"
                >
                  {holdRunning ? "Logging at 0…" : "Log hold"}
                </button>
              </div>
            ) : (
              <>
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
              </>
            )}
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
    <div className="space-y-4">
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
        <p className="font-semibold">Exercise Gallery</p>
      </Link>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Training plan</h3>
            <p className="mt-1 text-xs text-fog">{plan ? plan.name : "None selected"}</p>
          </div>
          {plan ? (
            <button
              type="button"
              onClick={() => setPlanOpen((open) => !open)}
              className="flex shrink-0 items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-sm text-fog"
            >
              {planOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {planOpen ? "Hide" : "Show"}
            </button>
          ) : null}
        </div>
        {!plan ? (
          <>
            <p className="mt-3 text-sm text-fog">Empty until you pick a split or build your own.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {customPlans.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTrainingPlan(item.id)}
                  className="rounded-full bg-lift/20 px-3 py-1.5 text-sm text-lift"
                >
                  {item.name}
                </button>
              ))}
              {TRAINING_PLANS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTrainingPlan(item.id)}
                  className="rounded-full bg-ink px-3 py-1.5 text-sm text-fog"
                >
                  {item.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPlanBuilderOpen(true)}
                className="rounded-full border border-lift/40 px-3 py-1.5 text-sm text-lift"
              >
                + Custom plan
              </button>
            </div>
          </>
        ) : planOpen ? (
          <>
            <p className="mt-3 mb-3 text-xs text-fog">{plan.blurb}</p>
            <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
              {customPlans.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTrainingPlan(item.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                    state.trainingPlanId === item.id ? "bg-lift text-ink" : "bg-lift/20 text-lift"
                  }`}
                >
                  {item.name}
                </button>
              ))}
              {TRAINING_PLANS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTrainingPlan(item.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                    state.trainingPlanId === item.id ? "bg-lift text-ink" : "bg-ink text-fog"
                  }`}
                >
                  {item.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPlanBuilderOpen(true)}
                className="shrink-0 rounded-full border border-lift/40 px-3 py-1.5 text-sm text-lift"
              >
                + Custom
              </button>
              <button
                type="button"
                onClick={() => setTrainingPlan(undefined)}
                className="shrink-0 rounded-full px-3 py-1.5 text-sm text-fog"
              >
                Clear
              </button>
              {plan.custom ? (
                <button
                  type="button"
                  onClick={() => removeCustomPlan(plan.id)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-sm text-run"
                >
                  Delete
                </button>
              ) : null}
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
                          <ExerciseArt name={exercise.name} size={36} className="rounded-xl" interactive={false} />
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
        {plan && todayDay ? (
          <button
            type="button"
            onClick={() => startPlanDay(todayDay, plan)}
            className="mt-3 w-full rounded-2xl bg-lift py-3 font-semibold text-ink"
          >
            Start today · {todayDay.title}
          </button>
        ) : plan && planOpen ? (
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
        {history.length === 0 ? (
          <p className="text-sm text-fog">No workouts logged yet.</p>
        ) : (
        <ul className="space-y-3">
          {history.slice(0, 10).map((workout) => {
            const sets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
            return (
              <li key={workout.id} className="rounded-2xl bg-ink px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{workout.template}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-xs text-fog">{formatShortDate(workout.date)}</p>
                    <button
                      type="button"
                      className="text-xs text-fog"
                      onClick={() => {
                        removeWorkout(workout.id);
                        showToast("Workout deleted", {
                          label: "Undo",
                          onClick: () => addWorkout(workout),
                        });
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <p className="text-sm text-fog">
                  {workout.exercises.length} exercises · {sets} sets · {workout.durationMin} min
                </p>
              </li>
            );
          })}
        </ul>
        )}
      </Card>
      <p className="px-1 text-center text-[11px] text-fog">
        Exercise art by Bryl Lim / Everkinetic, CC BY-SA 4.0 · @bryllim/workout-guide
      </p>
      <CustomPlanSheet
        open={planBuilderOpen}
        onClose={() => setPlanBuilderOpen(false)}
        onSave={(plan) => {
          saveCustomPlan(plan);
          showToast("Plan saved");
        }}
      />
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
            <ExerciseArt name={item.name} size={52} interactive={false} />
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
