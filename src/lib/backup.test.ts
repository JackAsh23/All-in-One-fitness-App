import { beforeEach, describe, expect, it, vi } from "vitest";

function mockBrowserGlobals() {
  const map = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => map.set(key, value),
    removeItem: (key: string) => map.delete(key),
    clear: () => map.clear(),
  });
  vi.stubGlobal("window", {
    clearInterval: vi.fn(),
    setInterval: vi.fn(() => 1),
    dispatchEvent: vi.fn(),
  });
}

describe("backup", () => {
  beforeEach(() => {
    vi.resetModules();
    mockBrowserGlobals();
  });

  it("exports and imports round-trip", async () => {
    const store = await import("./store");
    const beforeName = store.getState().profile.name;
    const beforeFoodCount = store.getState().foods.length;
    const raw = store.exportBackup();

    store.resetDemo();
    expect(store.getState().foods.length).toBeGreaterThan(0);

    const result = store.importBackup(raw);
    expect(result).toEqual({ ok: true });
    expect(store.getState().profile.name).toBe(beforeName);
    expect(store.getState().foods.length).toBe(beforeFoodCount);
  });

  it("rejects invalid backup", async () => {
    const store = await import("./store");
    expect(store.importBackup("{ not valid")).toEqual({ ok: false, error: "Could not read the backup file." });
    expect(store.importBackup(JSON.stringify({ foo: 1 }))).toEqual({
      ok: false,
      error: "This file is not a valid One Life backup.",
    });
  });
});
