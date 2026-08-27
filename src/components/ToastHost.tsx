import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { consumeToastAction, subscribeToast, type ToastAction } from "../lib/toast";

const SHOW_MS = 2400;
const UNDO_MS = 5000;
const EXIT_MS = 180;

export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null);
  const [action, setAction] = useState<ToastAction | undefined>();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    return subscribeToast((toast) => {
      setMessage(toast.message);
      setAction(toast.action);
      setLeaving(false);
    });
  }, []);

  useEffect(() => {
    if (!message || leaving) return;
    const hide = window.setTimeout(() => setLeaving(true), action ? UNDO_MS : SHOW_MS);
    return () => window.clearTimeout(hide);
  }, [message, action, leaving]);

  useEffect(() => {
    if (!leaving) return;
    const clear = window.setTimeout(() => {
      setMessage(null);
      setAction(undefined);
      setLeaving(false);
    }, EXIT_MS);
    return () => window.clearTimeout(clear);
  }, [leaving]);

  if (!message || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed left-1/2 z-[100] w-[min(90%,20rem)] -translate-x-1/2"
      style={{ bottom: "calc(5.4rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div
        className={`toast-pop pointer-events-auto flex items-center justify-center gap-3 rounded-2xl border border-life/40 bg-ink-2/95 px-4 py-3 text-center shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur${leaving ? " is-leaving" : ""}`}
        role="status"
        onClick={() => {
          if (!action) return;
          consumeToastAction();
          setLeaving(true);
        }}
      >
        <p className="flex min-w-0 items-center justify-center gap-2 text-sm font-medium text-snow">
          <Check size={16} className="shrink-0 text-life" />
          <span className="truncate">{message}</span>
        </p>
        {action ? (
          <button
            type="button"
            data-testid="toast-undo"
            className="shrink-0 rounded-full bg-life/15 px-3 py-1.5 text-sm font-semibold text-life"
            onClick={(event) => {
              event.stopPropagation();
              consumeToastAction();
              setLeaving(true);
            }}
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
