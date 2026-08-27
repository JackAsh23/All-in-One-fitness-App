import type { Integration, IntegrationId } from "./types";

export type IntegrationMeta = {
  id: IntegrationId;
  name: string;
  platform: "iOS" | "Android" | "Cross-platform";
  emoji: string;
  blurb: string;
  syncs: ("steps" | "runs" | "workouts")[];
};

export const INTEGRATION_CATALOG: IntegrationMeta[] = [
  {
    id: "apple-health",
    name: "Apple Health",
    platform: "iOS",
    emoji: "🍎",
    blurb: "Not available in the web app yet. Steps come from GPS walks/runs and Stats.",
    syncs: ["steps", "runs", "workouts"],
  },
  {
    id: "health-connect",
    name: "Health Connect",
    platform: "Android",
    emoji: "🤖",
    blurb: "Not available in the web app yet. Steps come from GPS walks/runs and Stats.",
    syncs: ["steps", "runs"],
  },
  {
    id: "strava",
    name: "Strava",
    platform: "Cross-platform",
    emoji: "🟠",
    blurb: "Prototype: demo connect imports sample runs. Real Strava OAuth is optional later.",
    syncs: ["runs"],
  },
  {
    id: "garmin",
    name: "Garmin Connect",
    platform: "Cross-platform",
    emoji: "⌚",
    blurb: "Not available in the web app yet. Steps come from GPS walks/runs and Stats.",
    syncs: ["steps", "runs"],
  },
];

export function defaultIntegrations(): Integration[] {
  return INTEGRATION_CATALOG.map((item) => ({
    id: item.id,
    connected: item.id === "apple-health",
    connectedAt: item.id === "apple-health" ? new Date().toISOString() : undefined,
    lastSyncAt: item.id === "apple-health" ? new Date().toISOString() : undefined,
  }));
}

export function disconnectedIntegrations(): Integration[] {
  return INTEGRATION_CATALOG.map((item) => ({
    id: item.id,
    connected: false,
  }));
}

export function integrationMeta(id: IntegrationId) {
  return INTEGRATION_CATALOG.find((item) => item.id === id);
}

export function connectedCount(integrations: Integration[]) {
  return integrations.filter((item) => item.connected).length;
}

export function formatSourceLabel(source?: string) {
  switch (source) {
    case "apple-health":
      return "Apple Health";
    case "health-connect":
      return "Health Connect";
    case "strava":
      return "Strava";
    case "garmin":
      return "Garmin";
    default:
      return "Manual";
  }
}
