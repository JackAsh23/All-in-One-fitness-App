import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Heatmap";
import { Sheet } from "../components/Sheet";
import { formatSourceLabel } from "../lib/integrations";
import { addDays, formatDuration, formatPace, formatShortDate, nowTime, todayISO, uid } from "../lib/dates";
import { summarizeDay } from "../lib/scoring";
import { addRun, useAppState } from "../lib/store";

export function RunPage() {
  const state = useAppState();
  const today = todayISO();
  const [live, setLive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [logOpen, setLogOpen] = useState(false);
  const [distance, setDistance] = useState("5.0");
  const [minutes, setMinutes] = useState("32");
  const [seconds, setSeconds] = useState("00");

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [live]);

  const liveKm = elapsed / (6.5 * 60);
  const liveCals = Math.round(liveKm * 62);

  const history = useMemo(
    () => [...state.runs].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
    [state.runs],
  );

  const weekStart = addDays(today, -6);
  const weekKm = state.runs.filter((run) => run.date >= weekStart).reduce((sum, run) => sum + run.distanceKm, 0);
  const monthPrefix = today.slice(0, 7);
  const monthKm = state.runs.filter((run) => run.date.startsWith(monthPrefix)).reduce((sum, run) => sum + run.distanceKm, 0);
  const totalKm = state.runs.reduce((sum, run) => sum + run.distanceKm, 0);
  const longest = state.runs.reduce((max, run) => Math.max(max, run.distanceKm), 0);
  const best5 = bestTime(state.runs, 5);
  const best10 = bestTime(state.runs, 10);
  const avgPaceSec =
    totalKm > 0 ? state.runs.reduce((sum, run) => sum + run.durationSec, 0) / totalKm : 0;

  function finishLive() {
    if (elapsed < 20) return;
    addRun({
      id: uid("run"),
      date: today,
      time: nowTime(),
      distanceKm: Math.round(liveKm * 100) / 100,
      durationSec: elapsed,
      calories: liveCals,
      notes: "Live session",
    });
    setLive(false);
    setElapsed(0);
  }

  function saveManual() {
    const km = Number(distance);
    const durationSec = Number(minutes) * 60 + Number(seconds);
    if (!km || !durationSec) return;
    addRun({
      id: uid("run"),
      date: today,
      time: nowTime(),
      distanceKm: km,
      durationSec,
      calories: Math.round(km * 62),
    });
    setLogOpen(false);
  }

  const todayRun = summarizeDay(state, today);

  return (
    <div className="space-y-4 animate-pop">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold">Run</h2>
        <Link to="/integrations" className="text-sm text-step">
          Sync apps
        </Link>
      </div>

      {live ? (
        <Card className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-run">Live run</p>
          <p className="mt-2 font-mono text-5xl">{formatDuration(elapsed)}</p>
          <p className="mt-2 text-2xl font-semibold">{liveKm.toFixed(2)} km</p>
          <p className="text-sm text-fog">
            {formatPace(elapsed, liveKm)} · {liveCals} kcal
          </p>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-2xl bg-card-2 py-3"
              onClick={() => {
                setLive(false);
                setElapsed(0);
              }}
            >
              Discard
            </button>
            <button type="button" className="flex-1 rounded-2xl bg-run py-3 font-semibold text-ink" onClick={finishLive}>
              Finish
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="rounded-3xl bg-run px-4 py-5 text-left font-semibold text-ink"
            onClick={() => {
              setElapsed(0);
              setLive(true);
            }}
          >
            Start run
            <p className="mt-1 text-sm font-normal opacity-80">Simulated GPS pace 6:30/km</p>
          </button>
          <button
            type="button"
            className="rounded-3xl border border-line bg-card px-4 py-5 text-left"
            onClick={() => setLogOpen(true)}
          >
            Quick log
            <p className="mt-1 text-sm text-fog">Paste a finished effort</p>
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Mini label="Today" value={todayRun.runKm ? `${todayRun.runKm.toFixed(1)} km` : "—"} />
        <Mini label="This week" value={`${weekKm.toFixed(1)} km`} />
        <Mini label="This month" value={`${monthKm.toFixed(0)} km`} />
        <Mini label="All-time" value={`${totalKm.toFixed(0)} km`} />
        <Mini label="Longest" value={`${longest.toFixed(1)} km`} />
        <Mini label="Avg pace" value={avgPaceSec ? formatPace(avgPaceSec, 1).replace("/km", "") + "/km" : "—"} />
        <Mini label="Best 5K" value={best5} />
        <Mini label="Best 10K" value={best10} />
      </div>

      <Card>
        <h3 className="mb-3 font-semibold">History</h3>
        <ul className="space-y-3">
          {history.slice(0, 12).map((run) => (
            <li key={run.id} className="flex items-center justify-between rounded-2xl bg-ink px-3 py-3">
              <div>
                <p className="font-medium">{formatShortDate(run.date)}</p>
                <p className="text-xs text-fog">
                  {run.notes ?? "Outdoor run"} · {formatSourceLabel(run.source)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono">{run.distanceKm.toFixed(2)} km</p>
                <p className="text-xs text-fog">
                  {formatDuration(run.durationSec)} · {formatPace(run.durationSec, run.distanceKm)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Sheet open={logOpen} title="Log a run" onClose={() => setLogOpen(false)}>
        <div className="space-y-3">
          <Field label="Distance (km)" value={distance} onChange={setDistance} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minutes" value={minutes} onChange={setMinutes} />
            <Field label="Seconds" value={seconds} onChange={setSeconds} />
          </div>
          <button type="button" onClick={saveManual} className="w-full rounded-2xl bg-run py-3 font-semibold text-ink">
            Save run
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-card p-4">
      <p className="text-[11px] uppercase tracking-wide text-fog">{label}</p>
      <p className="mt-1 font-mono text-lg">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-fog">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-2xl border border-line bg-card px-3 py-3 text-snow outline-none focus:border-life"
        inputMode="decimal"
      />
    </label>
  );
}

function bestTime(runs: { distanceKm: number; durationSec: number }[], target: number) {
  const eligible = runs.filter((run) => run.distanceKm >= target - 0.05);
  if (eligible.length === 0) return "—";
  const best = eligible.reduce((min, run) => Math.min(min, run.durationSec * (target / run.distanceKm)), Infinity);
  return formatDuration(best);
}
