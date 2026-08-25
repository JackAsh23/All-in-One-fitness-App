const STRAVA_OAUTH = "https://www.strava.com/oauth/authorize";
const STRAVA_API = "https://www.strava.com/api/v3";

export function stravaClientId(): string | undefined {
  const id = import.meta.env.VITE_STRAVA_CLIENT_ID?.trim();
  return id || undefined;
}

export function stravaTokenProxy(): string | undefined {
  const url = import.meta.env.VITE_STRAVA_TOKEN_PROXY?.trim();
  return url || undefined;
}

export function stravaConfigured(): boolean {
  return Boolean(stravaClientId() && stravaTokenProxy());
}

/** OAuth redirect — must match Strava app settings exactly. */
export function stravaRedirectUri(): string {
  if (typeof window === "undefined") return "http://localhost:5173/integrations";
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  const prefix = base && base !== "." ? base : "";
  return `${window.location.origin}${prefix}/integrations`;
}

export function stravaAuthorizeUrl(state: string): string {
  const clientId = stravaClientId();
  if (!clientId) throw new Error("Strava client ID is not configured.");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: stravaRedirectUri(),
    approval_prompt: "auto",
    scope: "activity:read_all",
    state,
  });
  return `${STRAVA_OAUTH}?${params.toString()}`;
}

export type StravaTokenResponse = {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: { id: number; firstname?: string; lastname?: string };
};

export async function exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
  const proxy = stravaTokenProxy();
  if (!proxy) throw new Error("Strava token proxy is not configured.");

  const response = await fetch(proxy, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: stravaRedirectUri(),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Strava token exchange failed (${response.status})`);
  }

  return (await response.json()) as StravaTokenResponse;
}

export async function refreshStravaToken(refreshToken: string): Promise<StravaTokenResponse> {
  const proxy = stravaTokenProxy();
  if (!proxy) throw new Error("Strava token proxy is not configured.");

  const response = await fetch(proxy, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Strava token refresh failed (${response.status})`);
  }

  return (await response.json()) as StravaTokenResponse;
}

export async function stravaApiGet<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${STRAVA_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Strava API error (${response.status})`);
  }
  return (await response.json()) as T;
}

export function tokenToStravaAuth(payload: StravaTokenResponse) {
  const athleteName = [payload.athlete.firstname, payload.athlete.lastname].filter(Boolean).join(" ");
  return {
    athleteId: payload.athlete.id,
    athleteName: athleteName || undefined,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: payload.expires_at,
  };
}

export const STRAVA_STATE_KEY = "one-life-strava-oauth-state";
