import { describe, expect, it, vi } from "vitest";
import { appendRoutedPoint } from "./osrm";

describe("appendRoutedPoint", () => {
  it("falls back to the snapped-or-raw point when routing is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
      })),
    );
    const path = await appendRoutedPoint([], { lat: 14.55, lng: 121.02 });
    expect(path).toEqual([{ lat: 14.55, lng: 121.02 }]);
    const next = await appendRoutedPoint(path, { lat: 14.56, lng: 121.03 });
    expect(next[next.length - 1]).toEqual({ lat: 14.56, lng: 121.03 });
  });

  it("appends footpath geometry between waypoints", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("/nearest/")) {
          return {
            ok: true,
            json: async () => ({ waypoints: [{ location: [121.0244, 14.5547] }] }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            routes: [
              {
                geometry: {
                  coordinates: [
                    [121.0244, 14.5547],
                    [121.025, 14.555],
                    [121.026, 14.556],
                  ],
                },
              },
            ],
          }),
        };
      }),
    );
    const first = await appendRoutedPoint([], { lat: 14.55, lng: 121.02 });
    expect(first[0]).toEqual({ lat: 14.5547, lng: 121.0244 });
    const routed = await appendRoutedPoint(first, { lat: 14.56, lng: 121.03 });
    expect(routed.length).toBeGreaterThan(2);
    expect(routed[routed.length - 1]).toEqual({ lat: 14.556, lng: 121.026 });
  });
});
