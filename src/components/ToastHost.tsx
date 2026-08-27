import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { subscribeToast, type ToastAction } from "../lib/toast";

const SHOW_MS = 2400;
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
    const hide = window.setTimeout(() => setLeaving(true), SHOW_MS);
    return () => window.clearTimeout(hide);
  }, [message, leaving]);

  useEffect(() => {
    if (!leaving) return;
    const clear = window.setTimeout(() => {
      setMessage(null);
      setAction(undefined);
      setLeaving(false);
    }, EXIT_MS);
    return () => window.clearTimeout(clear);
  }, [leaving]);

  if (!message) return null;

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-[90] w-[min(90%,20rem)] -translate-x-1/2"
      style={{ bottom: "calc(5.4rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div
        className={`toast-pop flex items-center justify-center gap-3 rounded-2xl border border-life/40 bg-ink-2/95 px-4 py-3 text-center shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur${leaving ? " is-leaving" : ""}`}
        role="status"
      >
        <p className="flex min-w-0 items-center justify-center gap-2 text-sm font-medium text-snow">
          <Check size={16} className="shrink-0 text-life" />
          <span className="truncate">{message}</span>
        </p>
        {action ? (
          <button
            type="button"
            className="pointer-events-auto shrink-0 text-sm font-semibold text-life"
            onClick={() => {
              action.onClick();
              setLeaving(true);
            }}
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
