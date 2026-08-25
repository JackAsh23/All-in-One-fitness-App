import { uid } from "../dates";
import type { RunLog, StravaAuth } from "../types";
import { refreshStravaToken, stravaApiGet, tokenToStravaAuth } from "./config";

type StravaActivity = {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  distance: number;
  moving_time: number;
  start_date: string;
  calories?: number;
};

const RUN_TYPES = new Set(["Run", "Walk", "Hike", "TrailRun", "VirtualRun"]);

export function mapStravaActivity(activity: StravaActivity): RunLog | null {
  const sport = activity.sport_type ?? activity.type;
  if (!RUN_TYPES.has(sport)) return null;

  const started = new Date(activity.start_date);
  if (Number.isNaN(started.getTime())) return null;

  const date = activity.start_date.slice(0, 10);
  const time = started.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return {
    id: uid("run"),
    date,
    time,
    distanceKm: Math.round((activity.distance / 1000) * 100) / 100,
    durationSec: activity.moving_time,
    calories: activity.calories ?? Math.round((activity.distance / 1000) * 62),
    notes: `${activity.name} · imported from Strava`,
    source: "strava",
    externalId: `strava_${activity.id}`,
    kind: sport === "Walk" ? "walk" : "run",
  };
}

export async function ensureFreshStravaToken(auth: StravaAuth): Promise<StravaAuth> {
  const now = Math.floor(Date.now() / 1000);
  if (auth.expiresAt > now + 120) return auth;

  const payload = await refreshStravaToken(auth.refreshToken);
  return tokenToStravaAuth(payload);
}

export async function fetchStravaRuns(auth: StravaAuth, existingExternalIds: Set<string>) {
  const fresh = await ensureFreshStravaToken(auth);
  const after = Math.floor(Date.now() / 1000) - 90 * 86400;
  const activities = await stravaApiGet<StravaActivity[]>(
    `/athlete/activities?after=${after}&per_page=50`,
    fresh.accessToken,
  );

  const imported: RunLog[] = [];
  for (const activity of activities) {
    const run = mapStravaActivity(activity);
    if (run?.externalId && !existingExternalIds.has(run.externalId)) {
      imported.push(run);
    }
  }

  return { auth: fresh, imported };
}
