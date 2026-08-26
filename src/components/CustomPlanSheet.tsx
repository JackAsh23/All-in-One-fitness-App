import { useState } from "react";
import { Sheet } from "./Sheet";
import { WEEKDAYS, type PlanDay, type TrainingPlan } from "../lib/trainingPlans";
import { uid } from "../lib/dates";

type DraftExercise = { name: string; sets: string; reps: string };
type DraftDay = { weekday: number; title: string; focus: string; exercises: DraftExercise[] };

function emptyDay(weekday: number, label: string): DraftDay {
  return {
    weekday,
    title: label,
    focus: "",
    exercises: [{ name: "", sets: "3", reps: "10" }],
  };
}

export function CustomPlanSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (plan: TrainingPlan) => void;
}) {
  const [name, setName] = useState("My split");
  const [days, setDays] = useState<DraftDay[]>([]);

  function toggleDay(weekday: number, label: string) {
    setDays((current) => {
      if (current.some((day) => day.weekday === weekday)) {
        return current.filter((day) => day.weekday !== weekday);
      }
      return [...current, emptyDay(weekday, label)].sort(
        (a, b) => (a.weekday === 0 ? 7 : a.weekday) - (b.weekday === 0 ? 7 : b.weekday),
      );
    });
  }

  function patchDay(weekday: number, patch: Partial<DraftDay>) {
    setDays((current) => current.map((day) => (day.weekday === weekday ? { ...day, ...patch } : day)));
  }

  function patchExercise(weekday: number, index: number, patch: Partial<DraftExercise>) {
    setDays((current) =>
      current.map((day) => {
        if (day.weekday !== weekday) return day;
        const exercises = day.exercises.map((item, i) => (i === index ? { ...item, ...patch } : item));
        return { ...day, exercises };
      }),
    );
  }

  function save() {
    const built: PlanDay[] = days
      .map((day) => {
        const label = WEEKDAYS.find((item) => item.weekday === day.weekday)?.label ?? "Day";
        return {
          weekday: day.weekday,
          label,
          title: day.title.trim() || label,
          focus: day.focus.trim() || "Custom",
          exercises: day.exercises
            .filter((item) => item.name.trim())
            .map((item) => ({
              name: item.name.trim(),
              sets: Math.max(1, Number(item.sets) || 3),
              reps: item.reps.trim() || "10",
            })),
        };
      })
      .filter((day) => day.exercises.length > 0);
    if (!built.length) return;
    onSave({
      id: uid("plan"),
      name: name.trim() || "Custom plan",
      blurb: "Your custom weekly split.",
      daysPerWeek: built.length,
      days: built,
      custom: true,
    });
    setName("My split");
    setDays([]);
    onClose();
  }

  return (
    <Sheet open={open} title="Custom training plan" onClose={onClose}>
      <div className="space-y-3">
        <label className="block text-sm text-fog">
          Plan name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-line bg-card px-3 py-3 text-snow outline-none"
            placeholder="Cut block, home gym…"
          />
        </label>
        <div>
          <p className="mb-2 text-sm text-fog">Training days</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((item) => {
              const on = days.some((day) => day.weekday === item.weekday);
              return (
                <button
                  key={item.weekday}
                  type="button"
                  onClick={() => toggleDay(item.weekday, item.label)}
                  className={`rounded-full px-3 py-1.5 text-sm ${on ? "bg-lift text-ink" : "bg-card text-fog"}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
        {days.map((day) => {
          const label = WEEKDAYS.find((item) => item.weekday === day.weekday)?.label ?? "Day";
          return (
            <div key={day.weekday} className="rounded-2xl bg-card p-3">
              <p className="mb-2 font-medium">{label}</p>
              <input
                value={day.title}
                onChange={(event) => patchDay(day.weekday, { title: event.target.value })}
                className="mb-2 w-full rounded-2xl border border-line bg-ink px-3 py-2 text-sm text-snow"
                placeholder="Session title"
              />
              {day.exercises.map((exercise, index) => (
                <div key={index} className="mb-2 grid grid-cols-[1fr_3rem_3.5rem] gap-1">
                  <input
                    value={exercise.name}
                    onChange={(event) => patchExercise(day.weekday, index, { name: event.target.value })}
                    className="rounded-xl border border-line bg-ink px-2 py-2 text-sm text-snow"
                    placeholder="Exercise"
                  />
                  <input
                    value={exercise.sets}
                    onChange={(event) => patchExercise(day.weekday, index, { sets: event.target.value })}
                    className="rounded-xl border border-line bg-ink px-2 py-2 text-center text-sm text-snow"
                    placeholder="3"
                    inputMode="numeric"
                  />
                  <input
                    value={exercise.reps}
                    onChange={(event) => patchExercise(day.weekday, index, { reps: event.target.value })}
                    className="rounded-xl border border-line bg-ink px-2 py-2 text-center text-sm text-snow"
                    placeholder="10 or 45s"
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-sm text-lift"
                onClick={() =>
                  patchDay(day.weekday, {
                    exercises: [...day.exercises, { name: "", sets: "3", reps: "10" }],
                  })
                }
              >
                + Exercise
              </button>
            </div>
          );
        })}
        <button
          type="button"
          disabled={days.length === 0}
          onClick={save}
          className="w-full rounded-2xl bg-lift py-3 font-semibold text-ink disabled:opacity-40"
        >
          Save plan
        </button>
      </div>
    </Sheet>
  );
}
