import { describe, expect, it } from "vitest";
import { mapStravaActivity } from "./activities";

describe("strava activities", () => {
  it("maps a Strava run to RunLog", () => {
    const run = mapStravaActivity({
      id: 123456789,
      name: "Morning Run",
      type: "Run",
      distance: 5200,
      moving_time: 1860,
      start_date: "2026-08-25T06:30:00Z",
      calories: 320,
    });

    expect(run).toMatchObject({
      distanceKm: 5.2,
      durationSec: 1860,
      calories: 320,
      source: "strava",
      externalId: "strava_123456789",
      kind: "run",
    });
  });

  it("ignores non-run activities", () => {
    expect(
      mapStravaActivity({
        id: 1,
        name: "Lift",
        type: "WeightTraining",
        distance: 0,
        moving_time: 3600,
        start_date: "2026-08-25T08:00:00Z",
      }),
    ).toBeNull();
  });
});
