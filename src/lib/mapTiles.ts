import type { TileLayerOptions } from "leaflet";

export type Basemap = {
  url: string;
  options: TileLayerOptions;
  provider: "maptiler" | "carto";
};

const MAPTILER_ATTR =
  '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OSM</a>';

const CARTO_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OSM</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>';

export function maptilerKey(): string {
  return (import.meta.env.VITE_MAPTILER_KEY ?? "").trim();
}

/** Dark streets from MapTiler when a key is set; otherwise CARTO Dark Matter. */
export function darkBasemap(key = maptilerKey()): Basemap {
  if (key) {
    return {
      provider: "maptiler",
      url: `https://api.maptiler.com/maps/streets-v4-dark/256/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}`,
      options: {
        minZoom: 1,
        maxZoom: 20,
        attribution: MAPTILER_ATTR,
        crossOrigin: true,
      },
    };
  }
  return {
    provider: "carto",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    options: {
      subdomains: "abcd",
      maxZoom: 20,
      attribution: CARTO_ATTR,
    },
  };
}
