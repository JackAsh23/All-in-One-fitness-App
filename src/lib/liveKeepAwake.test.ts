import { describe, expect, it } from "vitest";
import { jsWasFrozen } from "./liveKeepAwake";

describe("jsWasFrozen", () => {
  it("treats a multi-second jump as a screen-lock freeze", () => {
    expect(jsWasFrozen(1_000, 1_500)).toBe(false);
    expect(jsWasFrozen(1_000, 6_000)).toBe(true);
  });
});
