import { describe, expect, it } from "vitest";
import { subscribeToast, showToast } from "./toast";

describe("toast", () => {
  it("notifies subscribers", () => {
    const seen: string[] = [];
    const stop = subscribeToast((toast) => seen.push(toast.message));
    showToast("Food logged");
    showToast("  ");
    stop();
    showToast("Ignored");
    expect(seen).toEqual(["Food logged"]);
  });

  it("passes an undo action", () => {
    const labels: string[] = [];
    const stop = subscribeToast((toast) => {
      if (toast.action) labels.push(toast.action.label);
    });
    showToast("Workout deleted", { label: "Undo", onClick: () => undefined });
    stop();
    expect(labels).toEqual(["Undo"]);
  });
});
