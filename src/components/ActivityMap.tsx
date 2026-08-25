import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoPoint } from "../lib/types";

type Props = {
  center: GeoPoint;
  path?: GeoPoint[];
  route?: GeoPoint[];
  follow?: boolean;
  drawMode?: boolean;
  onAddPoint?: (point: GeoPoint) => void;
  className?: string;
};

export function ActivityMap({
  center,
  path = [],
  route = [],
  follow = true,
  drawMode = false,
  onAddPoint,
  className = "",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pathRef = useRef<L.Polyline | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const dotsRef = useRef<L.LayerGroup | null>(null);
  const onAddRef = useRef(onAddPoint);
  onAddRef.current = onAddPoint;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || mapRef.current) return;
    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
    }).setView([center.lat, center.lng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    pathRef.current = L.polyline([], {
      color: "#ff6b4a",
      weight: 5,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    routeRef.current = L.polyline([], {
      color: "#7aa6ff",
      weight: 4,
      dashArray: "8 8",
      opacity: 0.85,
    }).addTo(map);

    markerRef.current = L.circleMarker([center.lat, center.lng], {
      radius: 8,
      color: "#07090c",
      weight: 3,
      fillColor: "#3ee07f",
      fillOpacity: 1,
    }).addTo(map);

    dotsRef.current = L.layerGroup().addTo(map);

    map.on("click", (event: L.LeafletMouseEvent) => {
      onAddRef.current?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    });

    mapRef.current = map;
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    return () => {
      window.clearTimeout(t);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.invalidateSize();
    if (drawMode) {
      map.getContainer().style.cursor = "crosshair";
    } else {
      map.getContainer().style.cursor = "";
    }
  }, [drawMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    pathRef.current?.setLatLngs(path.map((p) => L.latLng(p.lat, p.lng)));
    routeRef.current?.setLatLngs(route.map((p) => L.latLng(p.lat, p.lng)));
    markerRef.current?.setLatLng([center.lat, center.lng]);

    dotsRef.current?.clearLayers();
    if (drawMode) {
      route.forEach((point, index) => {
        L.circleMarker([point.lat, point.lng], {
          radius: index === 0 ? 7 : 5,
          color: "#07090c",
          weight: 2,
          fillColor: index === 0 ? "#3ee07f" : "#7aa6ff",
          fillOpacity: 1,
        }).addTo(dotsRef.current!);
      });
    }

    if (follow) {
      map.setView([center.lat, center.lng], Math.max(map.getZoom(), 15), { animate: true });
    } else if (route.length > 1) {
      map.fitBounds(L.latLngBounds(route.map((p) => L.latLng(p.lat, p.lng))), { padding: [28, 28] });
    }
  }, [center, path, route, follow, drawMode]);

  return <div ref={wrapRef} className={`overflow-hidden rounded-3xl ${className}`} />;
}
