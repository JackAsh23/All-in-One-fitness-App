/** True when this event would zoom the whole page (pinch or ctrl+wheel). */
export function isViewportZoomEvent(event: { touches?: { length: number }; ctrlKey?: boolean }) {
  return Boolean(event.ctrlKey || (event.touches && event.touches.length > 1));
}

export function preventViewportZoomEvent(event: {
  touches?: { length: number };
  ctrlKey?: boolean;
  preventDefault: () => void;
}) {
  if (!isViewportZoomEvent(event)) return false;
  event.preventDefault();
  return true;
}

/** Stop iPhone Safari from pinch-zooming the PWA like a photo. */
export function lockViewportZoom() {
  if (typeof document === "undefined") return;
  const blockGesture = (event: Event) => event.preventDefault();
  document.addEventListener("gesturestart", blockGesture, { passive: false });
  document.addEventListener("gesturechange", blockGesture, { passive: false });
  document.addEventListener("gestureend", blockGesture, { passive: false });
  document.addEventListener(
    "touchmove",
    (event) => {
      preventViewportZoomEvent(event);
    },
    { passive: false },
  );
  document.addEventListener(
    "wheel",
    (event) => {
      preventViewportZoomEvent(event);
    },
    { passive: false },
  );
}
