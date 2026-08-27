import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const EXIT_MS = 200;
const SHEET_OPEN = "one-life-sheet-open";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [present, setPresent] = useState(open);
  const [leaving, setLeaving] = useState(false);
  const presentRef = useRef(open);

  useEffect(() => {
    if (open) {
      window.dispatchEvent(new Event(SHEET_OPEN));
      presentRef.current = true;
      setPresent(true);
      setLeaving(false);
      return;
    }
    if (!presentRef.current) return;
    if (prefersReducedMotion()) {
      presentRef.current = false;
      setPresent(false);
      setLeaving(false);
      return;
    }
    setLeaving(true);
    const timer = window.setTimeout(() => {
      presentRef.current = false;
      setPresent(false);
      setLeaving(false);
    }, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const hideIfLeaving = () => {
      if (!open) {
        presentRef.current = false;
        setPresent(false);
        setLeaving(false);
      }
    };
    window.addEventListener(SHEET_OPEN, hideIfLeaving);
    return () => window.removeEventListener(SHEET_OPEN, hideIfLeaving);
  }, [open]);

  useEffect(() => {
    if (!present || leaving) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [present, leaving, onClose]);

  if (!present || typeof document === "undefined") return null;

  const leavingClass = leaving ? " is-leaving" : "";

  return createPortal(
    <div className={`sheet-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]${leavingClass}`}>
      <button className="absolute inset-0 no-press" aria-label="Close sheet" onClick={onClose} />
      <div className={`sheet-panel relative z-10 max-h-[min(80dvh,640px)] w-full max-w-[400px] overflow-y-auto rounded-3xl border border-line bg-ink-2 p-5 shadow-2xl${leavingClass}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-card p-2 text-fog hover:text-snow"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
