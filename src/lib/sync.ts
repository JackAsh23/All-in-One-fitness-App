import { addDays, todayISO, uid } from "./dates";
import type { AppState, IntegrationId, RunLog, SyncEvent } from "./types";

type SyncResult = {
  state: AppState;
  events: SyncEvent[];
  importedRuns: number;
  updatedStepDays: number;
};

function event(source: IntegrationId | "system", kind: SyncEvent["kind"], message: string): SyncEvent {
  return { id: uid("sync"), at: new Date().toISOString(), source, kind, message };
}

function isConnected(state: AppState, id: IntegrationId) {
  return state.integrations.find((item) => item.id === id)?.connected ?? false;
}

function simulatedSteps(state: AppState, date: string, sources: IntegrationId[]): number {
  const existing = state.steps.find((entry) => entry.date === date)?.steps ?? 0;
  const dayOffset = Math.max(0, Math.floor((Date.now() - new Date(`${date}T12:00:00`).getTime()) / 86400000));
  const hour = new Date().getHours();
  const progress = date === todayISO() ? Math.min(1, (hour - 6) / 14) : 1;

  let base = 5200 + dayOffset * 137;
  if (sources.includes("apple-health")) base += 1800;
  if (sources.includes("health-connect")) base += 1500;
  if (sources.includes("garmin")) base += 2200;

  const wearable = Math.round(base * (0.55 + progress * 0.45));
  return Math.max(existing, wearable);
}

function stravaCandidates(state: AppState): RunLog[] {
  if (state.strava) return [];
  if (!isConnected(state, "strava")) return [];
  const today = todayISO();
  const candidates: RunLog[] = [
    {
      id: uid("run"),
      date: addDays(today, -1),
      time: "06:05",
      distanceKm: 4.8,
      durationSec: 31 * 60 + 12,
      calories: 296,
      notes: "Morning run · imported from Strava",
      source: "strava",
      externalId: "strava_demo_001",
    },
    {
      id: uid("run"),
      date: addDays(today, -4),
      time: "17:45",
      distanceKm: 6.1,
      durationSec: 39 * 60 + 50,
      calories: 378,
      notes: "Easy recovery · imported from Strava",
      source: "strava",
      externalId: "strava_demo_002",
    },
  ];
  const existing = new Set(state.runs.map((run) => run.externalId).filter(Boolean));
  return candidates.filter((run) => run.externalId && !existing.has(run.externalId));
}

function garminCandidates(state: AppState): RunLog[] {
  if (!isConnected(state, "garmin")) return [];
  const today = todayISO();
  const candidate: RunLog = {
    id: uid("run"),
    date: addDays(today, -2),
    time: "06:18",
    distanceKm: 3.6,
    durationSec: 23 * 60 + 40,
    calories: 222,
    notes: "Garmin easy jog",
    source: "garmin",
    externalId: "garmin_demo_001",
  };
  const exists = state.runs.some((run) => run.externalId === candidate.externalId);
  return exists ? [] : [candidate];
}

export function runSync(state: AppState): SyncResult {
  const events: SyncEvent[] = [];
  let next = structuredClone(state);
  let importedRuns = 0;
  let updatedStepDays = 0;

  const stepSources = (["apple-health", "health-connect", "garmin"] as IntegrationId[]).filter((id) =>
    isConnected(next, id),
  );

  if (stepSources.length > 0) {
    for (const date of [todayISO(), addDays(todayISO(), -1), addDays(todayISO(), -2)]) {
      const before = next.steps.find((entry) => entry.date === date)?.steps ?? 0;
      const after = simulatedSteps(next, date, stepSources);
      if (after > before) {
        next = {
          ...next,
          steps: next.steps.some((entry) => entry.date === date)
            ? next.steps.map((entry) => (entry.date === date ? { ...entry, steps: after } : entry))
            : [{ date, steps: after }, ...next.steps],
        };
        updatedStepDays += 1;
      }
    }
    if (updatedStepDays > 0) {
      events.push(
        event(stepSources[0], "steps", `Updated steps on ${updatedStepDays} day${updatedStepDays === 1 ? "" : "s"}.`),
      );
    }
  }

  const incomingRuns = [...stravaCandidates(next), ...garminCandidates(next)];
  if (incomingRuns.length > 0) {
    next = { ...next, runs: [...incomingRuns, ...next.runs] };
    importedRuns = incomingRuns.length;
    for (const run of incomingRuns) {
      events.push(event(run.source as IntegrationId, "run", `Imported ${run.distanceKm.toFixed(1)} km run.`));
    }
  }

  const now = new Date().toISOString();
  next = {
    ...next,
    integrations: next.integrations.map((item) =>
      item.connected ? { ...item, lastSyncAt: now } : item,
    ),
    syncLog: [...events, ...next.syncLog].slice(0, 40),
  };

  if (events.length === 0 && stepSources.length + (isConnected(next, "strava") ? 1 : 0) > 0) {
    events.push(event("system", "info", "Everything is already up to date."));
    next = { ...next, syncLog: [...events, ...next.syncLog].slice(0, 40) };
  }

  return { state: next, events, importedRuns, updatedStepDays };
}

export function relativeSyncTime(iso?: string) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}
