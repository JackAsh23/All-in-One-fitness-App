import { stravaClientId, stravaConfigured, stravaRedirectUri, stravaTokenProxy } from "./config";

export const STRAVA_CALLBACK_DOMAIN = "jackash23.github.io";
export const STRAVA_REDIRECT_URI_PROD = "https://jackash23.github.io/All-in-One-fitness-App/integrations";

export function stravaSetupStatus() {
  const hasClientId = Boolean(stravaClientId());
  const hasProxy = Boolean(stravaTokenProxy());
  return {
    ready: stravaConfigured(),
    hasClientId,
    hasProxy,
    redirectUri: typeof window !== "undefined" ? stravaRedirectUri() : STRAVA_REDIRECT_URI_PROD,
  };
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export {
  STRAVA_STATE_KEY,
  exchangeStravaCode,
  stravaAuthorizeUrl,
  stravaClientId,
  stravaConfigured,
  stravaRedirectUri,
  stravaTokenProxy,
  tokenToStravaAuth,
} from "./config";
export { fetchStravaRuns, mapStravaActivity } from "./activities";
