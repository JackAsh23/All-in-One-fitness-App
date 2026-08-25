import { Card } from "./Heatmap";
import { stravaSetupStatus } from "../lib/strava";

export function StravaSetupCard() {
  const status = stravaSetupStatus();
  if (status.ready) return null;

  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.18em] text-step">Prototype</p>
      <h3 className="mt-1 font-semibold">Demo integrations</h3>
      <p className="mt-1 text-sm text-fog">
        Connect Strava, Apple Health, Garmin, or Health Connect to simulate sync. Real Strava OAuth needs a paid
        Strava subscription — skip that for now.
      </p>
    </Card>
  );
}
