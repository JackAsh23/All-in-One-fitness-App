import catalog from "./guideCatalog.json";

const CDN = "https://cdn.jsdelivr.net/npm/@bryllim/workout-guide@1.0.0";

export type GuideExercise = {
  slug: string;
  name: string;
  muscle: string;
  equipment: string;
};

export const GUIDE_EXERCISES = catalog as GuideExercise[];

const NAME_TO_SLUG: Record<string, string> = {
  "Dumbbell Bench Press": "dumbbell-bench-press",
  "Barbell Bench Press": "bench-press",
  "Incline Dumbbell Press": "incline-dumbbell-press",
  "One Arm Dumbbell Row": "one-arm-dumbbell-row",
  "Barbell Row": "barbell-row",
  "Lat Pulldown": "lat-pulldown",
  "Pull-up": "pull-up",
  "Overhead Press": "overhead-press",
  "Lateral Raise": "lateral-raise",
  "Face Pull": "face-pull",
  "Dumbbell Curl": "bicep-curl",
  "Hammer Curl": "hammer-curl",
  "Tricep Pushdown": "tricep-pushdown",
  "Skull Crusher": "skull-crusher",
  "Dip": "dip",
  "Push-up": "push-up",
  "Back Squat": "squat",
  "Bodyweight Squat": "bodyweight-squat",
  "Romanian Deadlift": "romanian-deadlift",
  "Deadlift": "deadlift",
  "Walking Lunge": "walking-lunge",
  "Leg Press": "leg-press",
  "Calf Raise": "standing-calf-raise",
  "Plank": "plank",
  "Cable Fly": "cable-fly",
  "Seated Cable Row": "seated-row",
  "Hip Thrust": "hip-thrust",
  "Bulgarian Split Squat": "bulgarian-split-squat",
  "Chin-up": "chin-up",
  "Arnold Press": "arnold-press",
};

export function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function exerciseSlug(name: string): string | null {
  if (NAME_TO_SLUG[name]) return NAME_TO_SLUG[name];
  const exact = GUIDE_EXERCISES.find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (exact) return exact.slug;
  const slug = slugifyName(name);
  return GUIDE_EXERCISES.some((item) => item.slug === slug) ? slug : null;
}

export function exerciseImageUrl(name: string, frame: 1 | 2 | 3 = 2): string | null {
  const slug = exerciseSlug(name);
  if (!slug) return null;
  return `${CDN}/assets/${slug}/frame-${frame}.png`;
}

export function searchGuideExercises(
  query: string,
  muscle?: string | null,
  equipment?: string | null,
  limit = 40,
) {
  const q = query.trim().toLowerCase();
  const hits = GUIDE_EXERCISES.filter((item) => {
    if (muscle && item.muscle !== muscle) return false;
    if (equipment && item.equipment !== equipment) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.muscle.toLowerCase().includes(q) ||
      item.equipment.toLowerCase().includes(q) ||
      item.slug.includes(q)
    );
  });
  return limit ? hits.slice(0, limit) : hits;
}

export function slugImageUrl(slug: string, frame: 1 | 2 | 3 = 2) {
  return `${CDN}/assets/${slug}/frame-${frame}.png`;
}

export const GUIDE_MUSCLES = [...new Set(GUIDE_EXERCISES.map((item) => item.muscle))].sort();
export const GUIDE_EQUIPMENT = [...new Set(GUIDE_EXERCISES.map((item) => item.equipment))].sort();
