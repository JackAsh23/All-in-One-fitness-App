import { defaultCenter, makeLoop, makeOutAndBack, pathDistanceKm, type GeoPoint } from "./geo";
import type { RoutePlan, SportKind } from "./types";

export function presetRoutes(center: GeoPoint = defaultCenter()): RoutePlan[] {
  const easy = makeLoop(center, 0.48);
  const five = makeLoop(center, 0.8);
  const walk = makeLoop(center, 0.32);
  const outBack = makeOutAndBack(center, 4);
  return [
    {
      id: "preset-easy-5k",
      name: "Easy 5K loop",
      kind: "run",
      points: five,
      distanceKm: Math.round(pathDistanceKm(five) * 100) / 100,
      preset: true,
    },
    {
      id: "preset-3k",
      name: "Neighborhood 3K",
      kind: "run",
      points: easy,
      distanceKm: Math.round(pathDistanceKm(easy) * 100) / 100,
      preset: true,
    },
    {
      id: "preset-out-back",
      name: "Out & back 4K",
      kind: "run",
      points: outBack,
      distanceKm: Math.round(pathDistanceKm(outBack) * 100) / 100,
      preset: true,
    },
    {
      id: "preset-walk",
      name: "Easy walk loop",
      kind: "walk",
      points: walk,
      distanceKm: Math.round(pathDistanceKm(walk) * 100) / 100,
      preset: true,
    },
  ];
}

export function newDraftRoute(kind: SportKind, points: GeoPoint[] = []): RoutePlan {
  return {
    id: `route_${Date.now().toString(36)}`,
    name: kind === "walk" ? "Custom walk" : "Custom run",
    kind,
    points,
    distanceKm: Math.round(pathDistanceKm(points) * 100) / 100,
  };
}
