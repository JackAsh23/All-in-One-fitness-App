import type { GeoPoint } from "./types";

export type { GeoPoint };

const DEFAULT_CENTER: GeoPoint = { lat: 14.5547, lng: 121.0244 };

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function defaultCenter(): GeoPoint {
  return { ...DEFAULT_CENTER };
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function pathDistanceKm(points: GeoPoint[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i += 1) {
    d += haversineKm(points[i - 1], points[i]);
  }
  return d;
}

export function makeLoop(center: GeoPoint, radiusKm: number, n = 24): GeoPoint[] {
  const points: GeoPoint[] = [];
  const latPerKm = 1 / 110.574;
  const lngPerKm = 1 / (111.32 * Math.cos(toRad(center.lat)));
  for (let i = 0; i <= n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    points.push({
      lat: center.lat + Math.sin(a) * radiusKm * latPerKm,
      lng: center.lng + Math.cos(a) * radiusKm * lngPerKm * 0.72,
    });
  }
  return points;
}

export function makeOutAndBack(center: GeoPoint, km: number): GeoPoint[] {
  const latPerKm = 1 / 110.574;
  const half = km / 2;
  const north: GeoPoint = { lat: center.lat + half * latPerKm, lng: center.lng };
  return [center, north, center];
}

export function gpsSupported() {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export function requestGps(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!gpsSupported()) {
      reject(new Error("This browser cannot access GPS."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location permission was denied. Enable GPS to track this session."));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error("GPS timed out. Move outdoors and try again."));
        } else {
          reject(new Error("Could not read your location. Check location services and try again."));
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
    );
  });
}

export function watchGps(
  onPoint: (point: GeoPoint, accuracyM: number) => void,
  onError?: (message: string) => void,
): () => void {
  if (!gpsSupported()) return () => undefined;
  const id = navigator.geolocation.watchPosition(
    (pos) => onPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude }, pos.coords.accuracy),
    (err) => onError?.(err.message || "GPS signal lost"),
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

export function kcalForDistance(km: number, kind: "run" | "walk") {
  return Math.round(km * (kind === "walk" ? 45 : 62));
}

/** Decide whether a GPS sample should extend the recorded path. */
export function gpsPathUpdate(
  last: GeoPoint,
  next: GeoPoint,
  accuracyM: number,
): "ignore" | "append" | "rebase" {
  if (accuracyM > 80) return "ignore";
  const meters = haversineKm(last, next) * 1000;
  if (meters < 3) return "ignore";
  if (meters > 250) return "rebase";
  return "append";
}
