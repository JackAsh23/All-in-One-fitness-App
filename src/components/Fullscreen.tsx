import type { ReactNode } from "react";
import { createPortal } from "react-dom";

/** Full-screen overlay that escapes transformed ancestors (page animations). */
export function Fullscreen({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
