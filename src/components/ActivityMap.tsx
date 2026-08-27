import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { darkBasemap } from "../lib/mapTiles";
import type { GeoPoint } from "../lib/types";

type Props = {
  center: GeoPoint;
  path?: GeoPoint[];
  route?: GeoPoint[];
  waypoints?: GeoPoint[];
  follow?: boolean;
  drawMode?: boolean;
  onAddPoint?: (point: GeoPoint) => void;
  onMoveWaypoint?: (index: number, point: GeoPoint) => void;
  onDeleteWaypoint?: (index: number) => void;
  className?: string;
};

function waypointIcon(index: number, total: number) {
  const isStart = index === 0;
  const isEnd = total > 1 && index === total - 1;
  const bg = isStart ? "#3ee07f" : isEnd ? "#ff6b4a" : "#7aa6ff";
  return L.divIcon({
    className: "waypoint-pin",
    html: `<div class="waypoint-pin-inner" style="background:${bg}">${index + 1}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function locationIcon() {
  return L.divIcon({
    className: "user-location",
    html: `<div class="user-location-halo"></div><div class="user-location-dot"></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

export function ActivityMap({
  center,
  path = [],
  route = [],
  waypoints = [],
  follow = true,
  drawMode = false,
  onAddPoint,
  onMoveWaypoint,
  onDeleteWaypoint,
  className = "",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pathRef = useRef<L.Polyline | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const dotsRef = useRef<L.LayerGroup | null>(null);
  const onAddRef = useRef(onAddPoint);
  const onMoveRef = useRef(onMoveWaypoint);
  const onDeleteRef = useRef(onDeleteWaypoint);
  onAddRef.current = onAddPoint;
  onMoveRef.current = onMoveWaypoint;
  onDeleteRef.current = onDeleteWaypoint;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || mapRef.current) return;
    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
    }).setView([center.lat, center.lng], 15);

    const basemap = darkBasemap();
    L.tileLayer(basemap.url, basemap.options).addTo(map);

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

    markerRef.current = L.marker([center.lat, center.lng], {
      icon: locationIcon(),
      interactive: false,
      keyboard: false,
      zIndexOffset: 400,
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

    if (follow) {
      map.setView([center.lat, center.lng], Math.max(map.getZoom(), 15), { animate: true });
    } else if (!drawMode && route.length > 1) {
      map.fitBounds(L.latLngBounds(route.map((p) => L.latLng(p.lat, p.lng))), { padding: [28, 28] });
    }
  }, [center, path, route, follow, drawMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !dotsRef.current) return;
    dotsRef.current.clearLayers();
    if (!drawMode) return;
    waypoints.forEach((point, index) => {
      let suppressClick = false;
      const marker = L.marker([point.lat, point.lng], {
        icon: waypointIcon(index, waypoints.length),
        draggable: true,
        autoPan: true,
        bubblingMouseEvents: false,
        keyboard: false,
        zIndexOffset: 1000,
      });
      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        onDeleteRef.current?.(index);
      });
      marker.on("dragend", (event) => {
        suppressClick = true;
        const ll = event.target.getLatLng();
        onMoveRef.current?.(index, { lat: ll.lat, lng: ll.lng });
      });
      marker.addTo(dotsRef.current!);
    });
  }, [waypoints, drawMode]);

  return <div ref={wrapRef} className={`overflow-hidden rounded-3xl ${className}`} />;
}
