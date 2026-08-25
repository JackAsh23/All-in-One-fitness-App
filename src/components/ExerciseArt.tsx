import { useState } from "react";
import { exerciseImageUrl } from "../lib/exerciseArt";

export function ExerciseArt({
  name,
  size = 72,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const [frame, setFrame] = useState<1 | 2 | 3>(2);
  const [failed, setFailed] = useState(false);
  const src = exerciseImageUrl(name, frame);

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
        className="size-full object-contain p-1"
        onError={() => setFailed(true)}
      />
    </button>
  );
}
