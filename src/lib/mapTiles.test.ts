import { describe, expect, it } from "vitest";
import { darkBasemap } from "./mapTiles";

describe("darkBasemap", () => {
  it("uses MapTiler streets-dark when a key is present", () => {
    const layer = darkBasemap("test-key");
    expect(layer.provider).toBe("maptiler");
    expect(layer.url).toContain("streets-v4-dark");
    expect(layer.url).toContain("test-key");
  });

  it("falls back to CARTO dark without a key", () => {
    const layer = darkBasemap("");
    expect(layer.provider).toBe("carto");
    expect(layer.url).toContain("dark_all");
  });
});
