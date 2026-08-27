import { describe, expect, it } from "vitest";
import { subscribeToast, showToast } from "./toast";

describe("toast", () => {
  it("notifies subscribers", () => {
    const seen: string[] = [];
    const stop = subscribeToast((message) => seen.push(message));
    showToast("Food logged");
    showToast("  ");
    stop();
    showToast("Ignored");
    expect(seen).toEqual(["Food logged"]);
  });
});
