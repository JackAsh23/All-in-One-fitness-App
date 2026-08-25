import { useEffect, useState } from "react";
import { exerciseImageUrl, slugImageUrl } from "../lib/exerciseArt";

export function ExerciseArt({
  name,
  slug,
  size = 72,
  className = "",
  animate = false,
}: {
  name: string;
  slug?: string;
  size?: number;
  className?: string;
  animate?: boolean;
}) {
  const [frame, setFrame] = useState<1 | 2 | 3>(2);
  const [failed, setFailed] = useState(false);
  const src = slug ? slugImageUrl(slug, frame) : exerciseImageUrl(name, frame);

  useEffect(() => {
    if (!animate) return;
    const id = window.setInterval(() => {
      setFrame((current) => (current === 3 ? 1 : ((current + 1) as 1 | 2 | 3)));
    }, 700);
    return () => window.clearInterval(id);
  }, [animate]);

  if (!src || failed) {
    return (
      <div
        className={`grid place-items-center rounded-2xl bg-ink text-lg ${className}`}
        style={{ width: size, height: size }}
      >
        💪
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setFrame((current) => (current === 3 ? 1 : ((current + 1) as 1 | 2 | 3)))}
      className={`overflow-hidden rounded-2xl bg-white ${className}`}
      style={{ width: size, height: size }}
      aria-label={`${name} illustration`}
    >
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        className="size-full object-contain p-1"
        onError={() => setFailed(true)}
      />
    </button>
  );
}
