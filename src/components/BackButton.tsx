import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Props = {
  /** Used when there is no in-app history to pop. */
  fallback?: string;
  /** Override navigation — e.g. leave a live session without changing the route. */
  onClick?: () => void;
  label?: string;
  className?: string;
  iconOnly?: boolean;
};

export function BackButton({
  fallback = "/",
  onClick,
  label = "Back",
  className = "",
  iconOnly = false,
}: Props) {
  const navigate = useNavigate();

  function goBack() {
    if (onClick) {
      onClick();
      return;
    }
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={
        iconOnly
          ? `grid size-11 shrink-0 place-items-center rounded-full bg-life text-ink shadow-[0_8px_20px_rgba(62,224,127,0.4)] ${className}`
          : `flex min-h-12 shrink-0 items-center justify-center gap-1 rounded-2xl bg-life px-4 text-base font-semibold text-ink shadow-[0_8px_20px_rgba(62,224,127,0.35)] ${className}`
      }
      aria-label={label}
    >
      <ChevronLeft size={iconOnly ? 24 : 22} strokeWidth={2.75} />
      {iconOnly ? null : <span>{label}</span>}
    </button>
  );
}
