const STORAGE_KEY = "one-life-ring-fill-v1";

export type RingFillState = {
  date: string;
  training?: boolean;
};

type Store = Pick<Storage, "getItem" | "setItem">;

export function readRingFill(storage: Pick<Storage, "getItem">): RingFillState | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RingFillState;
    if (!parsed || typeof parsed.date !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Play the Home training ring fill once after today's first saved lift. */
export function shouldPlayTrainingFill(
  today: string,
  trainingComplete: boolean,
  storage: Pick<Storage, "getItem">,
): boolean {
  if (!trainingComplete) return false;
  const saved = readRingFill(storage);
  if (!saved || saved.date !== today) return true;
  return saved.training !== true;
}

export function markTrainingFillPlayed(today: string, storage: Store) {
  const saved = readRingFill(storage);
  const next: RingFillState =
    saved?.date === today ? { ...saved, date: today, training: true } : { date: today, training: true };
  storage.setItem(STORAGE_KEY, JSON.stringify(next));
}
