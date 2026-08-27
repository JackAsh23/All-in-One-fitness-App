import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./idb", () => ({
  canUseIndexedDb: () => true,
  idbReadState: async () => null,
  idbWriteState: async () => {},
}));

function mockBrowserGlobals() {
  vi.stubGlobal("localStorage", {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  });
  vi.stubGlobal("window", {
    clearInterval: vi.fn(),
    setInterval: vi.fn(() => 1),
    dispatchEvent: vi.fn(),
  });
}

describe("food log undo", () => {
  beforeEach(() => {
    vi.resetModules();
    mockBrowserGlobals();
  });

  it("restores a removed food by id", async () => {
    const store = await import("./store");
    await store.initStore();
    store.logQuickFood({
      name: "Test yogurt",
      meal: "lunch",
      calories: 185,
      protein: 25,
      carbs: 10,
      fat: 5,
    });
    const food = store.getState().foods[0];
    expect(food?.name).toBe("Test yogurt");
    store.removeFood(food.id);
    expect(store.getState().foods.some((item) => item.id === food.id)).toBe(false);
    store.addFood(food);
    expect(store.getState().foods[0]).toMatchObject({
      id: food.id,
      name: "Test yogurt",
      calories: 185,
      protein: 25,
    });
    store.addFood({ ...food, calories: 200 });
    expect(store.getState().foods.filter((item) => item.id === food.id)).toHaveLength(1);
    expect(store.getState().foods[0].calories).toBe(200);
  });
});
