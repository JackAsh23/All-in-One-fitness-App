import { describe, expect, it } from "vitest";
import { gpsPathUpdate, gpsTrackSegments } from "./geo";

const a = { lat: 14.55, lng: 121.02, t: 1_000 };

describe("gpsPathUpdate", () => {
  it("ignores inaccurate or tiny moves", () => {
    expect(gpsPathUpdate(a, { lat: 14.55001, lng: 121.02, t: 2_000 }, 12)).toBe("ignore");
    expect(gpsPathUpdate(a, { lat: 14.551, lng: 121.02, t: 2_000 }, 90)).toBe("ignore");
  });

  it("appends a jogging-sized step and rebases a teleport", () => {
    expect(gpsPathUpdate(a, { lat: 14.551, lng: 121.02, t: 2_000 }, 12)).toBe("append");
    expect(gpsPathUpdate(a, { lat: 14.6, lng: 121.1, t: 2_000 }, 12)).toBe("rebase");
  });

  it("marks a long freeze plus a jump as a lock-screen gap instead of a fake street", () => {
    expect(gpsPathUpdate(a, { lat: 14.553, lng: 121.02, t: 20_000 }, 12)).toBe("gap");
    expect(gpsPathUpdate(a, { lat: 14.6, lng: 121.1, t: 80_000 }, 12)).toBe("gap");
  });
});

describe("gpsTrackSegments", () => {
  it("splits a lock-screen jump onto a dashed gap", () => {
    const segments = gpsTrackSegments([
      { lat: 14.55, lng: 121.02 },
      { lat: 14.551, lng: 121.02 },
      { lat: 14.554, lng: 121.023, gap: true },
    ]);
    expect(segments.map((segment) => segment.kind)).toEqual(["solid", "gap", "solid"]);
    expect(segments[1]?.points).toHaveLength(2);
  });
});
