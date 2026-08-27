import { pathDistanceKm } from "./geo";
import type { GeoPoint } from "./types";

const OSRM_FOOT = "https://router.project-osrm.org";

type OsrmNearest = {
  waypoints?: { location?: [number, number] }[];
};

type OsrmRoute = {
  routes?: { geometry?: { coordinates?: [number, number][] } }[];
};

async function osrmJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/** Snap a tap to the nearest walkable way so the line sits on a path, not through buildings. */
export async function snapToFootpath(point: GeoPoint): Promise<GeoPoint> {
  const data = await osrmJson<OsrmNearest>(
    `${OSRM_FOOT}/nearest/v1/foot/${point.lng},${point.lat}?number=1`,
  );
  const loc = data?.waypoints?.[0]?.location;
  if (!loc) return point;
  return { lng: loc[0], lat: loc[1] };
}

/** Pedestrian route between two points. Returns null if OSRM cannot route. */
export async function routeAlongFootpaths(from: GeoPoint, to: GeoPoint): Promise<GeoPoint[] | null> {
  const data = await osrmJson<OsrmRoute>(
    `${OSRM_FOOT}/route/v1/foot/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`,
  );
  const coords = data?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  return coords.map(([lng, lat]) => ({ lat, lng }));
}

/** Append a new tap onto a planned path, following walkable ways when the network is available. */
export async function appendRoutedPoint(
  path: GeoPoint[],
  waypoint: GeoPoint,
): Promise<GeoPoint[]> {
  const snapped = await snapToFootpath(waypoint);
  if (path.length === 0) return [snapped];
  const from = path[path.length - 1];
  const routed = await routeAlongFootpaths(from, snapped);
  if (!routed || routed.length < 2) return [...path, snapped];
  return [...path, ...routed.slice(1)];
}

/** Rebuild a planned path from user pins (after a drag or delete). */
export async function rebuildRoutedPath(waypoints: GeoPoint[]): Promise<{
  points: GeoPoint[];
  waypoints: GeoPoint[];
  distanceKm: number;
}> {
  if (waypoints.length === 0) {
    return { points: [], waypoints: [], distanceKm: 0 };
  }

  const snapped: GeoPoint[] = [];
  for (const waypoint of waypoints) {
    snapped.push(await snapToFootpath(waypoint));
  }

  if (snapped.length === 1) {
    return { points: [...snapped], waypoints: snapped, distanceKm: 0 };
  }

  const points: GeoPoint[] = [];
  for (let i = 1; i < snapped.length; i += 1) {
    const routed = await routeAlongFootpaths(snapped[i - 1], snapped[i]);
    if (!routed || routed.length < 2) {
      if (points.length === 0) points.push(snapped[i - 1]);
      points.push(snapped[i]);
      continue;
    }
    if (points.length === 0) {
      points.push(...routed);
    } else {
      points.push(...routed.slice(1));
    }
  }

  return {
    points,
    waypoints: snapped,
    distanceKm: pathDistanceKm(points),
  };
}
