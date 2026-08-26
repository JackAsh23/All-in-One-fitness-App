import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBlankState, createDemoState } from "./demo";

const STORAGE_KEY = "one-life-fitness-v6";

const memory = {
  idb: null as unknown,
  ls: new Map<string, string>(),
  writes: [] as unknown[],
  readGate: null as Promise<void> | null,
};

vi.mock("./idb", () => ({
  canUseIndexedDb: () => true,
  idbReadState: async () => {
    if (memory.readGate) await memory.readGate;
    return memory.idb;
  },
  idbWriteState: async (value: unknown) => {
    memory.writes.push(value);
    memory.idb = JSON.parse(JSON.stringify(value));
  },
}));

function mockBrowserGlobals() {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => memory.ls.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.ls.set(key, value);
    },
    removeItem: (key: string) => {
      memory.ls.delete(key);
    },
    clear: () => memory.ls.clear(),
  });
  vi.stubGlobal("window", {
    clearInterval: vi.fn(),
    setInterval: vi.fn(() => 1),
    dispatchEvent: vi.fn(),
  });
}

describe("store persist across updates", () => {
  beforeEach(() => {
    memory.idb = null;
    memory.ls.clear();
    memory.writes = [];
    memory.readGate = null;
    vi.resetModules();
    mockBrowserGlobals();
  });

  it("starts empty instead of seeding the demo year", async () => {
    const store = await import("./store");
    await store.initStore();
    expect(store.getState().runs).toEqual([]);
    expect(store.getState().foods).toEqual([]);
    expect(store.getState().dataMode).toBe("live");
  });

  it("restores live IndexedDB data when localStorage is empty after an update", async () => {
    const live = {
      ...createBlankState(),
      dataMode: "live" as const,
      savedAt: "2026-08-26T10:00:00.000Z",
      foods: [
        {
          id: "food_live",
          date: "2026-08-26",
          time: "12:00",
          meal: "lunch" as const,
          name: "Chicken rice",
          grams: 350,
          calories: 520,
          protein: 42,
          carbs: 48,
          fat: 14,
        },
      ],
    };
    memory.idb = live;

    const store = await import("./store");
    await store.initStore();

    expect(store.getState().foods).toHaveLength(1);
    expect(store.getState().foods[0]?.name).toBe("Chicken rice");
    expect(store.getState().runs).toEqual([]);
    expect(store.getState().dataMode).toBe("live");
  });

  it("does not write demo over IndexedDB before hydrate finishes", async () => {
    let release!: () => void;
    memory.readGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    memory.idb = {
      ...createBlankState(),
      dataMode: "live",
      savedAt: "2026-08-26T10:00:00.000Z",
      foods: [
        {
          id: "food_live",
          date: "2026-08-26",
          time: "12:00",
          meal: "lunch",
          name: "Adobo",
          grams: 250,
          calories: 310,
          protein: 28,
          carbs: 8,
          fat: 18,
        },
      ],
    };

    const store = await import("./store");
    const boot = store.initStore();
    await Promise.resolve();
    await Promise.resolve();
    expect(memory.writes).toEqual([]);

    release();
    await boot;

    expect(store.getState().foods[0]?.name).toBe("Adobo");
    expect(memory.writes.length).toBeGreaterThan(0);
    const last = memory.writes[memory.writes.length - 1] as { foods: { name: string }[] };
    expect(last.foods[0]?.name).toBe("Adobo");
  });

  it("keeps Start fresh live data instead of reloading the demo year from IndexedDB", async () => {
    const liveBlank = {
      ...createBlankState(),
      dataMode: "live" as const,
      savedAt: "2026-08-26T15:00:00.000Z",
    };
    memory.ls.set(STORAGE_KEY, JSON.stringify(liveBlank));
    memory.idb = { ...createDemoState(), savedAt: "2026-08-26T08:00:00.000Z" };

    const store = await import("./store");
    await store.initStore();

    expect(store.getState().runs).toEqual([]);
    expect(store.getState().foods).toEqual([]);
    expect(store.getState().dataMode).toBe("live");
  });
});
