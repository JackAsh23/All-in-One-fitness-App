import { describe, expect, it } from "vitest";
import { gpsPathUpdate } from "./geo";

const a = { lat: 14.55, lng: 121.02 };

describe("gpsPathUpdate", () => {
  it("ignores inaccurate or tiny moves", () => {
    expect(gpsPathUpdate(a, { lat: 14.55001, lng: 121.02 }, 12)).toBe("ignore");
    expect(gpsPathUpdate(a, { lat: 14.551, lng: 121.02 }, 90)).toBe("ignore");
  });

  it("appends a jogging-sized step and rebases a teleport", () => {
    expect(gpsPathUpdate(a, { lat: 14.551, lng: 121.02 }, 12)).toBe("append");
    expect(gpsPathUpdate(a, { lat: 14.6, lng: 121.1 }, 12)).toBe("rebase");
  });
});
