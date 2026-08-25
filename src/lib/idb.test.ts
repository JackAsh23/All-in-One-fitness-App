import { describe, expect, it, vi } from "vitest";
import { canUseIndexedDb } from "./idb";

describe("idb", () => {
  it("reports unavailable when indexedDB is missing", () => {
    vi.stubGlobal("indexedDB", undefined);
    expect(canUseIndexedDb()).toBe(false);
  });
});
