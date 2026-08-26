import type { AppState } from "./types";

/** Seeded sample year: Apple Health on, lots of history, Jollibee in favorites. */
export function looksLikeSeededDemo(state: AppState): boolean {
  if (state.dataMode === "demo") return true;
  if (state.dataMode === "live") return false;
  const apple = state.integrations.find((item) => item.id === "apple-health");
  const hasJollibee = state.favoriteFoodIds.includes("jollibee-chickenjoy");
  return Boolean(apple?.connected && state.autoSync && state.runs.length >= 40 && hasJollibee);
}

/** Empty tracker that has never been stamped/saved — typical first paint before IndexedDB hydrates. */
export function isVirginBlank(state: AppState): boolean {
  if (state.savedAt) return false;
  if (state.dataMode === "demo") return false;
  return (
    state.runs.length === 0 &&
    state.workouts.length === 0 &&
    state.foods.length === 0 &&
    state.steps.length === 0 &&
    state.weightLogs.length === 0
  );
}

/**
 * Pick which snapshot to keep when localStorage and IndexedDB disagree.
 * The seeded demo year never wins over live or empty tracking data.
 */
export function preferPersistedState(local: AppState, remote: AppState): AppState {
  const localDemo = looksLikeSeededDemo(local);
  const remoteDemo = looksLikeSeededDemo(remote);
  if (remoteDemo && !localDemo) return local;
  if (localDemo && !remoteDemo) return remote;

  if (isVirginBlank(local) && !isVirginBlank(remote)) return remote;
  if (isVirginBlank(remote) && !isVirginBlank(local)) return local;

  const localAt = local.savedAt ?? "";
  const remoteAt = remote.savedAt ?? "";
  if (localAt && remoteAt) return localAt >= remoteAt ? local : remote;
  if (remoteAt && !localAt) return remote;
  if (localAt && !remoteAt) return local;
  return local;
}
