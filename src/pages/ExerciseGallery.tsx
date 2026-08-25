import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExerciseArt } from "../components/ExerciseArt";
import { Sheet } from "../components/Sheet";
import {
  GUIDE_EQUIPMENT,
  GUIDE_EXERCISES,
  GUIDE_MUSCLES,
  searchGuideExercises,
  slugImageUrl,
  type GuideExercise,
} from "../lib/exerciseArt";

export function ExerciseGalleryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [shown, setShown] = useState(30);
  const [selected, setSelected] = useState<GuideExercise | null>(null);

  const hits = useMemo(
    () => searchGuideExercises(query, muscle, equipment, 0),
    [query, muscle, equipment],
  );
  const visible = hits.slice(0, shown);

  return (
    <div className="space-y-4 animate-pop">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-lift">Workout Guide</p>
          <h2 className="text-2xl font-semibold">Exercise gallery</h2>
        </div>
        <Link to="/workout" className="text-sm text-fog">
          Plans
        </Link>
      </div>
      <p className="text-sm text-fog">
        {GUIDE_EXERCISES.length} exercises from @bryllim/workout-guide — 3 PNG frames each. Tap a card to preview,
        then start a set.
      </p>

      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setShown(30);
        }}
        placeholder="Search pull-up, chest, dumbbell…"
        className="w-full rounded-2xl border border-line bg-card px-3 py-3 outline-none"
      />

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <Chip active={muscle === null} onClick={() => setMuscle(null)} label="All muscles" />
        {GUIDE_MUSCLES.map((item) => (
          <Chip key={item} active={muscle === item} onClick={() => { setMuscle(item); setShown(30); }} label={item} />
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <Chip active={equipment === null} onClick={() => setEquipment(null)} label="All gear" />
        {GUIDE_EQUIPMENT.map((item) => (
          <Chip
            key={item}
            active={equipment === item}
            onClick={() => {
              setEquipment(item);
              setShown(30);
            }}
            label={item}
          />
        ))}
      </div>

      <p className="text-xs text-fog">{hits.length} matches</p>
      <div className="grid grid-cols-2 gap-3">
        {visible.map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => setSelected(item)}
            className="rounded-3xl border border-line bg-card p-3 text-left"
          >
            <ExerciseArt name={item.name} slug={item.slug} size={128} className="mx-auto" />
            <p className="mt-2 truncate font-medium">{item.name}</p>
            <p className="text-xs text-fog">
              {item.muscle} · {item.equipment}
            </p>
          </button>
        ))}
      </div>
      {shown < hits.length ? (
        <button
          type="button"
          onClick={() => setShown((n) => n + 30)}
          className="w-full rounded-2xl bg-card py-3 text-sm"
        >
          Show more
        </button>
      ) : null}

      <Sheet open={Boolean(selected)} title={selected?.name ?? "Exercise"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as const).map((frame) => (
                <img
                  key={frame}
                  src={slugImageUrl(selected.slug, frame)}
                  alt={`${selected.name} frame ${frame}`}
                  className="aspect-square w-full rounded-2xl bg-white object-contain p-1"
                />
              ))}
            </div>
            <ExerciseArt name={selected.name} slug={selected.slug} size={220} animate className="mx-auto" />
            <p className="text-sm text-fog">
              {selected.muscle} · {selected.equipment} · 3 frames
            </p>
            <button
              type="button"
              className="w-full rounded-2xl bg-lift py-3 font-semibold text-ink"
              onClick={() => navigate("/workout", { state: { startExercise: selected.name } })}
            >
              Start this exercise
            </button>
            <p className="text-center text-[11px] text-fog">
              Art by Bryl Lim / Everkinetic · CC BY-SA 4.0
            </p>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${active ? "bg-lift text-ink" : "bg-card text-fog"}`}
    >
      {label}
    </button>
  );
}
