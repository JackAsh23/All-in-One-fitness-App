import { describe, expect, it, vi } from "vitest";
import { isViewportZoomEvent, preventViewportZoomEvent } from "./lockViewportZoom";

describe("lockViewportZoom", () => {
  it("treats two-finger touch and ctrl+wheel as page zoom", () => {
    expect(isViewportZoomEvent({ touches: { length: 1 } })).toBe(false);
    expect(isViewportZoomEvent({ touches: { length: 2 } })).toBe(true);
    expect(isViewportZoomEvent({ ctrlKey: true })).toBe(true);
    expect(isViewportZoomEvent({ ctrlKey: false })).toBe(false);
  });

  it("prevents default only for zoom gestures", () => {
    const zoom = { touches: { length: 2 }, preventDefault: vi.fn() };
    const pan = { touches: { length: 1 }, preventDefault: vi.fn() };
    expect(preventViewportZoomEvent(zoom)).toBe(true);
    expect(zoom.preventDefault).toHaveBeenCalledOnce();
    expect(preventViewportZoomEvent(pan)).toBe(false);
    expect(pan.preventDefault).not.toHaveBeenCalled();
  });
});
