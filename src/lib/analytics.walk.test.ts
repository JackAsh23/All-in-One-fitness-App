import { describe, expect, it } from "vitest";
import { runsOnly, walkPersonalRecords, walksOnly, weeklySteps } from "./analytics";
import { todayISO } from "./dates";
import type { RunLog } from "./types";

const run: RunLog = {
  id: "r1",
  date: "2026-08-26",
  time: "06:00",
  distanceKm: 5,
  durationSec: 1800,
  calories: 310,
  kind: "run",
};
const walk: RunLog = {
  id: "w1",
  date: "2026-08-26",
  time: "18:00",
  distanceKm: 2.4,
  durationSec: 1680,
  calories: 108,
  kind: "walk",
};

describe("walk and step analytics", () => {
  it("splits runs and walks", () => {
    expect(runsOnly([run, walk]).map((item) => item.id)).toEqual(["r1"]);
    expect(walksOnly([run, walk]).map((item) => item.id)).toEqual(["w1"]);
  });

  it("labels walk records as walks", () => {
    const labels = walkPersonalRecords([walk]).map((pr) => pr.label);
    expect(labels.some((label) => /walk/i.test(label))).toBe(true);
    expect(labels.some((label) => /run/i.test(label))).toBe(false);
  });

  it("buckets weekly steps", () => {
    const weeks = weeklySteps([{ date: todayISO(), steps: 8000 }], 1);
    expect(weeks).toHaveLength(1);
    expect(weeks[0]?.value).toBe(8000);
  });
});
