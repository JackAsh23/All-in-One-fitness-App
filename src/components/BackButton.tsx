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
          ? `grid size-10 shrink-0 place-items-center rounded-full border border-line bg-card text-fog ${className}`
          : `inline-flex shrink-0 items-center gap-0.5 rounded-full border border-line bg-card px-2.5 py-1.5 text-sm text-fog ${className}`
      }
      aria-label={label}
    >
      <ChevronLeft size={18} />
      {iconOnly ? null : <span>{label}</span>}
    </button>
  );
}
