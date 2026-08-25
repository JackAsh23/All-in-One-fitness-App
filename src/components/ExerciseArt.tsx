import { useEffect, useState } from "react";
import { exerciseImageUrl, exerciseSlug, slugImageCdnUrl, slugImageUrl } from "../lib/exerciseArt";

export function ExerciseArt({
  name,
  slug,
  size = 72,
  className = "",
  animate = false,
  fill = false,
}: {
  name: string;
  slug?: string;
  size?: number;
  className?: string;
  animate?: boolean;
  fill?: boolean;
}) {
  const [frame, setFrame] = useState<1 | 2 | 3>(2);
  const resolvedSlug = slug ?? exerciseSlug(name);
  const local = resolvedSlug ? slugImageUrl(resolvedSlug, frame) : exerciseImageUrl(name, frame);
  const cdn = resolvedSlug ? slugImageCdnUrl(resolvedSlug, frame) : null;
  const [src, setSrc] = useState<string | null>(local);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(local);
    setFailed(false);
  }, [local]);

  useEffect(() => {
    if (!animate) return;
    const id = window.setInterval(() => {
      setFrame((current) => (current === 3 ? 1 : ((current + 1) as 1 | 2 | 3)));
    }, 700);
    return () => window.clearInterval(id);
  }, [animate]);

  const boxClass = `overflow-hidden rounded-2xl bg-[#0b0f14] ${fill ? "aspect-square w-full" : ""} ${className}`;
  const boxStyle = fill ? undefined : { width: size, height: size };

  if (!src || failed) {
    return (
      <div className={`grid place-items-center text-lg ${boxClass}`} style={boxStyle}>
        💪
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setFrame((current) => (current === 3 ? 1 : ((current + 1) as 1 | 2 | 3)))}
      className={boxClass}
      style={boxStyle}
      aria-label={`${name} illustration`}
    >
      <img
        src={src}
        alt={name}
        width={fill ? undefined : size}
        height={fill ? undefined : size}
        loading="lazy"
        className="size-full object-contain"
        onError={() => {
          if (cdn && src !== cdn) setSrc(cdn);
          else setFailed(true);
        }}
      />
    </button>
  );
}
