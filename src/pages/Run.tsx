import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Footprints, MapPinned, Navigation, Pause, PersonStanding, Play } from "lucide-react";
import { ActivityMap } from "../components/ActivityMap";
import { BackButton } from "../components/BackButton";
import { Card } from "../components/Heatmap";
import { Fullscreen } from "../components/Fullscreen";
import { Sheet } from "../components/Sheet";
import { formatSourceLabel } from "../lib/integrations";
import { addDays, formatDuration, formatPace, formatShortDate, nowTime, todayISO, uid } from "../lib/dates";
import { defaultCenter, gpsPathUpdate, kcalForDistance, pathDistanceKm, requestGps, watchGps } from "../lib/geo";
import { newDraftRoute, presetRoutes } from "../lib/routes";
import { summarizeDay } from "../lib/scoring";
import { addRun, removeRoute, removeRun, saveRoute, useAppState } from "../lib/store";
import { appendRoutedPoint, rebuildRoutedPath } from "../lib/osrm";
import { showToast } from "../lib/toast";
import type { GeoPoint, RoutePlan, SportKind } from "../lib/types";

type Phase = "home" | "gps" | "plan" | "live";

export function RunPage() {
  const state = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = todayISO();
  const [kind, setKind] = useState<SportKind>("run");
  const [phase, setPhase] = useState<Phase>("home");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [center, setCenter] = useState<GeoPoint>(defaultCenter());
  const [path, setPath] = useState<GeoPoint[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [selectedRoute, setSelectedRoute] = useState<RoutePlan | null>(null);
  const [draft, setDraft] = useState<RoutePlan | null>(null);
  const [routeName, setRouteName] = useState("");
  const [routingBusy, setRoutingBusy] = useState(false);
  const [routeHint, setRouteHint] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [paused, setPaused] = useState(false);
  const [distance, setDistance] = useState("5.0");
  const [minutes, setMinutes] = useState("32");
  const [seconds, setSeconds] = useState("00");
  const [logKind, setLogKind] = useState<SportKind>("run");
  const pendingPhase = useRef<Phase>("live");
  const watchOff = useRef<(() => void) | null>(null);
  const draftRef = useRef<RoutePlan | null>(null);
  const routeGen = useRef(0);
  const moveTimer = useRef(0);
  const elapsedRef = useRef(0);
  const pathRef = useRef<GeoPoint[]>([]);
  const finishingRef = useRef(false);
  const pausedRef = useRef(false);
  draftRef.current = draft;
  elapsedRef.current = elapsed;
  pathRef.current = path;

  const presets = useMemo(() => presetRoutes(center), [center]);
  const allRoutes = [...state.savedRoutes, ...presets.filter((p) => !state.savedRoutes.some((s) => s.id === p.id))];

  useEffect(() => {
    if (phase !== "live" || paused) return;
    const id = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase, paused]);

  useEffect(() => {
    return () => {
      watchOff.current?.();
      window.clearTimeout(moveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (phase === "live" || phase === "plan") return;
    watchOff.current?.();
    watchOff.current = null;
  }, [phase]);

  const liveKm = pathDistanceKm(path);
  const liveCals = kcalForDistance(liveKm, kind);
  const plannedKm = selectedRoute?.distanceKm ?? 0;
  const remainingKm = selectedRoute ? Math.max(0, plannedKm - liveKm) : 0;

  const history = useMemo(
    () => [...state.runs].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
    [state.runs],
  );

  const weekStart = addDays(today, -6);
  const weekKm = state.runs.filter((run) => run.date >= weekStart).reduce((sum, run) => sum + run.distanceKm, 0);
  const monthPrefix = today.slice(0, 7);
  const monthKm = state.runs.filter((run) => run.date.startsWith(monthPrefix)).reduce((sum, run) => sum + run.distanceKm, 0);
  const totalKm = state.runs.reduce((sum, run) => sum + run.distanceKm, 0);
  const walks = state.runs.filter((run) => run.kind === "walk");
  const todayRun = summarizeDay(state, today);

  async function unlockGps(next: Phase, nextKind: SportKind, route?: RoutePlan | null) {
    pendingPhase.current = next;
    setKind(nextKind);
    setSelectedRoute(route ?? null);
    setPhase("gps");
    setGpsError(null);
    setGpsBusy(true);
    try {
      const point = await requestGps();
      setCenter(point);
      setPath([point]);
      setGpsBusy(false);
      if (next === "live") {
        finishingRef.current = false;
        pausedRef.current = false;
        setPaused(false);
        startWatch(point);
      } else if (next === "plan") {
        startWatch(point, { locateOnly: true });
      }
      setPhase(next);
    } catch (error) {
      setGpsBusy(false);
      setGpsError(error instanceof Error ? error.message : "GPS is required to start.");
    }
  }

  useEffect(() => {
    if (searchParams.get("start") !== "1") return;
    setSearchParams({}, { replace: true });
    void unlockGps("live", "run");
  }, []);

  function startWatch(origin: GeoPoint, options?: { locateOnly?: boolean }) {
    watchOff.current?.();
    let last = origin;
    const locateOnly = options?.locateOnly === true;
    watchOff.current = watchGps((point, accuracyM) => {
      setCenter(point);
      if (locateOnly || pausedRef.current) {
        last = point;
        return;
      }
      const action = gpsPathUpdate(last, point, accuracyM);
      if (action === "ignore") return;
      last = point;
      if (action === "rebase") return;
      setPath((current) => [...current, point]);
    }, (message) => setGpsError(message));
  }

  function pauseLive() {
    pausedRef.current = true;
    setPaused(true);
  }

  function resumeLive() {
    pausedRef.current = false;
    setPaused(false);
    setConfirmDiscard(false);
  }

  function finishLive() {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const tracked = pathRef.current;
    const km = Math.round(pathDistanceKm(tracked) * 100) / 100;
    addRun({
      id: uid(kind),
      date: today,
      time: nowTime(),
      distanceKm: km,
      durationSec: Math.max(elapsedRef.current, 1),
      calories: kcalForDistance(km, kind),
      kind,
      notes: selectedRoute ? `Followed ${selectedRoute.name}` : kind === "walk" ? "Outdoor walk" : "Outdoor run",
      routeId: selectedRoute?.id,
      path: tracked,
    });
    stopLive();
    showToast(kind === "walk" ? "Walk saved" : "Run saved");
  }

  function stopLive() {
    watchOff.current?.();
    watchOff.current = null;
    setPhase("home");
    setElapsed(0);
    setPath([]);
    setGpsError(null);
    setConfirmDiscard(false);
    pausedRef.current = false;
    setPaused(false);
  }

  useEffect(() => {
    if (phase !== "live" || paused || !selectedRoute) return;
    if (liveKm < 0.15 || remainingKm > 0.05) return;
    finishLive();
  }, [phase, paused, liveKm, remainingKm, selectedRoute]);

  function saveManual() {
    const km = Number(distance);
    const durationSec = Number(minutes) * 60 + Number(seconds);
    if (!km || !durationSec) return;
    addRun({
      id: uid(logKind),
      date: today,
      time: nowTime(),
      distanceKm: km,
      durationSec,
      calories: kcalForDistance(km, logKind),
      kind: logKind,
    });
    setLogOpen(false);
    showToast(logKind === "walk" ? "Walk logged" : "Run logged");
  }

  async function addPlanPoint(point: GeoPoint) {
    if (routingBusy) return;
    const gen = ++routeGen.current;
    setRoutingBusy(true);
    setRouteHint("Snapping to walkable paths…");
    try {
      const base = draftRef.current ?? newDraftRoute(kind, []);
      const points = await appendRoutedPoint(base.points, point);
      if (gen !== routeGen.current) return;
      const snapped = points[points.length - 1] ?? point;
      const waypoints = [...(base.waypoints ?? []), snapped];
      setDraft({
        ...base,
        waypoints,
        points,
        distanceKm: Math.round(pathDistanceKm(points) * 100) / 100,
      });
      setCenter(points[points.length - 1] ?? point);
      setRouteHint("Drag a pin to tweak the path · tap a pin to delete it.");
    } catch {
      if (gen !== routeGen.current) return;
      setRouteHint("Could not reach the map router — dropped a straight point.");
    } finally {
      if (gen === routeGen.current) setRoutingBusy(false);
    }
  }

  async function applyWaypoints(waypoints: GeoPoint[], hint: string) {
    const gen = ++routeGen.current;
    window.clearTimeout(moveTimer.current);
    if (waypoints.length === 0) {
      const base = draftRef.current ?? newDraftRoute(kind, []);
      setDraft({ ...base, waypoints: [], points: [], distanceKm: 0 });
      setRouteHint("Tap the map to drop a pin.");
      setRoutingBusy(false);
      return;
    }
    setRoutingBusy(true);
    setRouteHint(hint);
    try {
      const rebuilt = await rebuildRoutedPath(waypoints);
      if (gen !== routeGen.current) return;
      const base = draftRef.current ?? newDraftRoute(kind, []);
      setDraft({
        ...base,
        waypoints: rebuilt.waypoints,
        points: rebuilt.points,
        distanceKm: Math.round(rebuilt.distanceKm * 100) / 100,
      });
      setRouteHint("Drag a pin to tweak the path · tap a pin to delete it.");
    } catch {
      if (gen !== routeGen.current) return;
      setRouteHint("Could not reroute — try moving the pin again.");
    } finally {
      if (gen === routeGen.current) setRoutingBusy(false);
    }
  }

  function movePlanWaypoint(index: number, point: GeoPoint) {
    const base = draftRef.current;
    if (!base) return;
    const waypoints = [...(base.waypoints ?? [])];
    if (index < 0 || index >= waypoints.length) return;
    waypoints[index] = point;
    setDraft({ ...base, waypoints });
    window.clearTimeout(moveTimer.current);
    moveTimer.current = window.setTimeout(() => {
      void applyWaypoints(waypoints, "Rerouting…");
    }, 180);
  }

  function deletePlanWaypoint(index: number) {
    const base = draftRef.current;
    if (!base?.waypoints?.length) return;
    if (index < 0 || index >= base.waypoints.length) return;
    const waypoints = base.waypoints.filter((_, i) => i !== index);
    void applyWaypoints(waypoints, "Removing pin…");
  }

  function removeLastWaypoint() {
    const base = draftRef.current;
    if (!base?.waypoints?.length) return;
    void applyWaypoints(base.waypoints.slice(0, -1), "Removing last pin…");
  }

  function followDraft() {
    if (!draft || draft.points.length < 2) return;
    const named = { ...draft, name: routeName.trim() || draft.name };
    saveRoute(named);
    setSelectedRoute(named);
    finishingRef.current = false;
    pausedRef.current = false;
    setPaused(false);
    setPath([center]);
    startWatch(center);
    setElapsed(0);
    setPhase("live");
  }

  function persistDraftRoute() {
    if (!draft || draft.points.length < 2) return;
    const named = { ...draft, name: routeName.trim() || draft.name };
    saveRoute(named);
    setSelectedRoute(named);
    setDraft(null);
    setPhase("home");
    showToast("Route saved");
  }

  if (phase === "live") {
    const accent = kind === "walk" ? "bg-step text-ink" : "bg-run text-ink";
    const finishLabel = kind === "walk" ? "Finish walk" : "Finish run";
    return (
      <Fullscreen>
      <div className="fixed inset-0 z-[70] bg-ink">
        <div className="mx-auto flex h-dvh max-w-[430px] flex-col">
          <div className="relative min-h-0 flex-1">
            <ActivityMap
              center={center}
              path={path}
              route={selectedRoute?.points ?? []}
              follow
              className="h-full rounded-none"
            />
          </div>
          <div className="z-10 shrink-0 rounded-t-3xl border-t border-line bg-ink px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className={`text-xs uppercase tracking-[0.2em] ${paused ? "text-eat" : "text-run"}`}>
              {paused ? "Paused" : "Live"} {kind}
              {selectedRoute ? ` · ${selectedRoute.name}` : ""}
            </p>
            <p className="mt-1 font-mono text-5xl">{formatDuration(elapsed)}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Stat value={`${liveKm.toFixed(2)}`} label="km" />
              <Stat value={formatPace(elapsed, liveKm).replace("/km", "")} label="/km" />
              <Stat value={`${liveCals}`} label="kcal" />
            </div>
            {paused ? (
              <p className="mt-2 text-center text-sm text-fog">
                Timer and distance are frozen. Resume when you start moving again.
              </p>
            ) : selectedRoute ? (
              <p className="mt-2 text-center text-sm text-fog">
                <Navigation size={12} className="mr-1 inline" />
                {remainingKm.toFixed(2)} km left · finishes and saves at 0
              </p>
            ) : null}
            {gpsError ? <p className="mt-2 text-center text-sm text-run">{gpsError}</p> : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl bg-card py-4 text-lg font-semibold text-snow"
                onClick={paused ? resumeLive : pauseLive}
              >
                {paused ? <Play size={20} /> : <Pause size={20} />}
                {paused ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                className={`rounded-2xl py-4 text-lg font-semibold ${accent}`}
                onClick={finishLive}
              >
                {finishLabel}
              </button>
            </div>
            <button
              type="button"
              className="mt-2 w-full py-2 text-sm font-medium text-snow/80"
              onClick={() => {
                if (!confirmDiscard) {
                  setConfirmDiscard(true);
                  return;
                }
                stopLive();
                showToast(kind === "walk" ? "Walk discarded" : "Run discarded");
              }}
            >
              {confirmDiscard ? "Tap again to discard without saving" : "Discard"}
            </button>
          </div>
        </div>
      </div>
      </Fullscreen>
    );
  }

  if (phase === "plan") {
    return (
      <Fullscreen>
      <div className="fixed inset-0 z-[70] bg-ink">
        <div className="mx-auto flex h-dvh max-w-[430px] flex-col">
          <div className="relative h-[62%]">
            <ActivityMap
              center={center}
              route={draft?.points ?? []}
              waypoints={draft?.waypoints ?? []}
              follow={false}
              drawMode
              onAddPoint={addPlanPoint}
              onMoveWaypoint={movePlanWaypoint}
              onDeleteWaypoint={deletePlanWaypoint}
              className="h-full rounded-none"
            />
            <div className="pointer-events-auto absolute left-4 top-[max(0.75rem,env(safe-area-inset-top))] z-[2000]">
              <BackButton
                fallback="/run"
                onClick={() => {
                  setDraft(null);
                  setPhase("home");
                }}
              />
            </div>
          </div>
          <div className="flex-1 rounded-t-3xl border-t border-line bg-ink px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-snow">
              Tap the map to drop pins
            </p>
            <h2 className="mt-1 text-2xl font-semibold">{draft?.distanceKm.toFixed(2) ?? "0.00"} km planned</h2>
            <p className="text-sm text-snow/80">
              {draft?.waypoints?.length ?? 0}{" "}
              {(draft?.waypoints?.length ?? 0) === 1 ? "pin" : "pins"} · {kind}
              {routingBusy ? " · routing…" : ""}
            </p>
            <p className="mt-1 text-sm text-snow">
              {routeHint ?? "Drag a pin to tweak the path · tap a pin to delete it."}
            </p>
            {(draft?.waypoints?.length ?? 0) > 0 ? (
              <button
                type="button"
                className="mt-2 w-full rounded-2xl border border-line bg-card py-3 text-sm font-semibold text-snow"
                onClick={removeLastWaypoint}
              >
                Remove last pin
              </button>
            ) : null}
            <input
              value={routeName}
              onChange={(event) => setRouteName(event.target.value)}
              placeholder={kind === "walk" ? "Name this walk" : "Name this run"}
              className="mt-3 w-full rounded-2xl border border-line bg-card px-3 py-3 text-snow outline-none"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-2xl bg-card py-3 font-semibold text-snow"
                onClick={() => {
                  setDraft(null);
                  setRouteName("");
                  setPhase("home");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-2xl bg-life py-3 font-semibold text-ink disabled:opacity-40"
                disabled={!draft || draft.points.length < 2 || routingBusy}
                onClick={persistDraftRoute}
              >
                Save route
              </button>
            </div>
            <button
              type="button"
              className="mt-2 w-full rounded-2xl bg-run py-3 font-semibold text-ink disabled:opacity-40"
              disabled={!draft || draft.points.length < 2 || routingBusy}
              onClick={followDraft}
            >
              Follow route
            </button>
          </div>
        </div>
      </div>
      </Fullscreen>
    );
  }

  if (phase === "gps") {
    return (
      <div className="space-y-4 animate-pop">
        <BackButton fallback="/run" className="w-full" onClick={() => setPhase("home")} />
        <Card className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-run">GPS required</p>
          <h2 className="mt-2 text-2xl font-semibold">Allow location to track this {kind}</h2>
          <p className="mt-2 text-sm text-fog">
            One Life uses your phone GPS to draw the route, like Strava. We never send this data anywhere.
          </p>
          {gpsError ? <p className="mt-3 text-sm text-run">{gpsError}</p> : null}
          <button
            type="button"
            disabled={gpsBusy}
            className="mt-5 w-full rounded-2xl bg-run py-3 font-semibold text-ink disabled:opacity-50"
            onClick={() => unlockGps(pendingPhase.current, kind, selectedRoute)}
          >
            {gpsBusy ? "Waiting for GPS…" : "Allow GPS & start"}
          </button>
          <button type="button" className="mt-3 w-full text-sm font-medium text-snow" onClick={() => setPhase("home")}>
            Cancel
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold">Run</h2>
        <Link to="/integrations" className="text-sm text-step">
          Sync apps
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-card p-1">
        <button
          type="button"
          onClick={() => setKind("run")}
          aria-pressed={kind === "run"}
          className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold ${
            kind === "run" ? "bg-run text-ink" : "bg-transparent text-snow"
          }`}
        >
          <PersonStanding size={16} />
          Run
        </button>
        <button
          type="button"
          onClick={() => setKind("walk")}
          aria-pressed={kind === "walk"}
          className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold ${
            kind === "walk" ? "bg-step text-ink" : "bg-transparent text-snow"
          }`}
        >
          <Footprints size={16} />
          Walk
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className={`rounded-3xl px-4 py-5 text-left font-semibold text-ink ${kind === "walk" ? "bg-step" : "bg-run"}`}
          onClick={() => unlockGps("live", kind, selectedRoute)}
        >
          Start {kind}
          <p className="mt-1 text-sm font-normal text-ink/80">
            {selectedRoute ? `Follow ${selectedRoute.name}` : "GPS tracking + live map"}
          </p>
        </button>
        <button
          type="button"
          className="rounded-3xl border border-line bg-card px-4 py-5 text-left font-semibold"
          onClick={() => setLogOpen(true)}
        >
          Quick log
          <p className="mt-1 text-sm text-fog">Paste a finished effort</p>
        </button>
        <button
          type="button"
          className="col-span-2 flex items-center gap-3 rounded-3xl border border-step/40 bg-step/10 px-4 py-4 text-left"
          onClick={() => {
            setDraft(newDraftRoute(kind, []));
            setRouteName(kind === "walk" ? "Custom walk" : "Custom run");
            void unlockGps("plan", kind);
          }}
        >
          <MapPinned size={18} className="text-step" />
          <span>
            <p className="font-semibold">Plan a route</p>
            <p className="text-sm text-fog">Follow walkable paths, then save it for later</p>
          </span>
        </button>
      </div>

      <Card>
        <h3 className="mb-3 font-semibold">Routes</h3>
        {state.savedRoutes.length === 0 ? (
          <p className="mb-3 text-sm text-fog">Plan a route and tap Save to keep it for later runs.</p>
        ) : null}
        <div className="space-y-2">
          {allRoutes.map((route) => (
            <div key={route.id} className="flex items-center gap-2 rounded-2xl bg-ink px-3 py-2">
              <button
                type="button"
                onClick={() => setSelectedRoute(selectedRoute?.id === route.id ? null : route)}
                className="flex-1 text-left"
              >
                <p className="font-medium">
                  {selectedRoute?.id === route.id ? "● " : ""}
                  {route.name}
                </p>
                <p className="text-xs text-fog">
                  {route.distanceKm.toFixed(1)} km · {route.kind}
                  {route.preset ? " · preset" : ""}
                </p>
              </button>
              <button
                type="button"
                className="rounded-full bg-run px-3 py-1.5 text-xs font-semibold text-ink"
                onClick={() => unlockGps("live", route.kind, route)}
              >
                Follow
              </button>
              {!route.preset ? (
                <button type="button" className="text-xs font-medium text-snow" onClick={() => removeRoute(route.id)}>
                  ✕
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Mini label="Today" value={todayRun.runKm ? `${todayRun.runKm.toFixed(1)} km` : "—"} />
        <Mini label="This week" value={`${weekKm.toFixed(1)} km`} />
        <Mini label="This month" value={`${monthKm.toFixed(0)} km`} />
        <Mini label="Walks logged" value={`${walks.length}`} />
        <Mini label="All-time" value={`${totalKm.toFixed(0)} km`} />
        <Mini label="Longest" value={`${state.runs.reduce((max, run) => Math.max(max, run.distanceKm), 0).toFixed(1)} km`} />
      </div>

      <Card>
        <h3 className="mb-3 font-semibold">History</h3>
        {history.length === 0 ? (
          <p className="text-sm text-fog">No runs or walks logged yet.</p>
        ) : (
          <ul className="space-y-3">
            {history.slice(0, 12).map((run) => (
              <li key={run.id} className="flex items-center justify-between gap-2 rounded-2xl bg-ink px-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {formatShortDate(run.date)} · {run.kind === "walk" ? "Walk" : "Run"}
                  </p>
                  <p className="text-xs text-fog">
                    {run.notes ?? "Outdoor"} · {formatSourceLabel(run.source)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono">{run.distanceKm.toFixed(2)} km</p>
                  <p className="text-xs text-fog">
                    {formatDuration(run.durationSec)} · {formatPace(run.durationSec, run.distanceKm)}
                  </p>
                  <button
                    type="button"
                    className="mt-1 text-xs font-medium text-snow"
                    onClick={() => {
                      removeRun(run.id);
                      showToast(`${run.kind === "walk" ? "Walk" : "Run"} deleted`, {
                        label: "Undo",
                        onClick: () => addRun(run),
                      });
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Sheet open={logOpen} title="Log a session" onClose={() => setLogOpen(false)}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(["run", "walk"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setLogKind(id)}
                className={`rounded-2xl py-2 ${logKind === id ? "bg-run text-ink" : "bg-card text-fog"}`}
              >
                {id === "run" ? "Run" : "Walk"}
              </button>
            ))}
          </div>
          <Field label="Distance (km)" value={distance} onChange={setDistance} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minutes" value={minutes} onChange={setMinutes} />
            <Field label="Seconds" value={seconds} onChange={setSeconds} />
          </div>
          <button type="button" onClick={saveManual} className="w-full rounded-2xl bg-run py-3 font-semibold text-ink">
            Save {logKind}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-card px-2 py-3">
      <p className="font-mono text-lg">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-fog">{label}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-card p-4">
      <p className="text-[11px] uppercase tracking-wide text-fog">{label}</p>
      <p className="mt-1 font-mono text-lg">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-fog">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-2xl border border-line bg-card px-3 py-3 text-snow outline-none focus:border-life"
        inputMode="decimal"
      />
    </label>
  );
}
