import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Card } from "../components/Heatmap";
import { StravaSetupCard } from "../components/StravaSetupCard";
import { INTEGRATION_CATALOG, integrationMeta } from "../lib/integrations";
import { relativeSyncTime } from "../lib/sync";
import {
  STRAVA_STATE_KEY,
  stravaAuthorizeUrl,
  stravaConfigured,
} from "../lib/strava";
import {
  completeStravaOAuth,
  disconnectStrava,
  setAutoSync,
  setIntegrationConnected,
  syncNow,
  useAppState,
} from "../lib/store";
import type { IntegrationId } from "../lib/types";

export function IntegrationsPage() {
  const state = useAppState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [syncing, setSyncing] = useState(false);
  const [stravaBusy, setStravaBusy] = useState(false);
  const [stravaError, setStravaError] = useState<string | null>(null);
  const connected = state.integrations.filter((item) => item.connected).length;
  const stravaLive = stravaConfigured();

  useEffect(() => {
    const code = searchParams.get("code");
    const oauthState = searchParams.get("state");
    if (!code) return;

    const expected = sessionStorage.getItem(STRAVA_STATE_KEY);
    sessionStorage.removeItem(STRAVA_STATE_KEY);
    if (!expected || oauthState !== expected) {
      setStravaError("Strava login failed — please try again.");
      navigate("/integrations", { replace: true });
      return;
    }

    setStravaBusy(true);
    completeStravaOAuth(code)
      .then(() => navigate("/integrations", { replace: true }))
      .catch((error) => {
        setStravaError(error instanceof Error ? error.message : "Strava connect failed.");
        navigate("/integrations", { replace: true });
      })
      .finally(() => setStravaBusy(false));
  }, [searchParams, navigate]);

  function startStravaOAuth() {
    const oauthState = crypto.randomUUID();
    sessionStorage.setItem(STRAVA_STATE_KEY, oauthState);
    window.location.href = stravaAuthorizeUrl(oauthState);
  }

  async function handleSyncNow() {
    setSyncing(true);
    try {
      await syncNow(false);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-step">Connections</p>
        <h2 className="text-2xl font-semibold">Integrations</h2>
      </div>

      {stravaError ? (
        <Card className="border-run/40 bg-run/10">
          <p className="text-sm text-run">{stravaError}</p>
        </Card>
      ) : null}

      <StravaSetupCard />

      <Card>
        <p className="text-sm text-fog">
          The web app cannot read Apple Health or Garmin steps. Home counts real GPS walks and runs, plus steps you log on Stats. Connect is a placeholder until a native build exists.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-ink px-3 py-3">
          <div>
            <p className="font-medium">Background auto-sync</p>
            <p className="text-xs text-fog">Only real GPS and Stats logs — no fake step counts</p>
          </div>
          <input
            type="checkbox"
            checked={state.autoSync}
            onChange={(event) => setAutoSync(event.target.checked)}
            className="size-5 accent-life"
          />
        </div>
        <button
          type="button"
          disabled={syncing || stravaBusy}
          onClick={() => void handleSyncNow()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-life py-3 font-semibold text-ink disabled:opacity-60"
        >
          <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing…" : "Sync now"}
        </button>
        <p className="mt-2 text-center text-xs text-fog">
          {connected} connected · last activity {relativeSyncTime(state.syncLog[0]?.at)}
        </p>
      </Card>

      {INTEGRATION_CATALOG.map((meta) => {
        const live = state.integrations.find((item) => item.id === meta.id);
        const on = live?.connected ?? false;
        const isStrava = meta.id === "strava";

        return (
          <Card key={meta.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl">{meta.emoji}</p>
                <h3 className="font-semibold">{meta.name}</h3>
                <p className="text-xs text-fog">{meta.platform}</p>
                {isStrava && state.strava?.athleteName ? (
                  <p className="mt-1 text-xs text-life">Connected as {state.strava.athleteName}</p>
                ) : null}
              </div>
              {isStrava && stravaLive ? (
                on ? (
                  <button
                    type="button"
                    disabled={stravaBusy}
                    onClick={() => disconnectStrava()}
                    className="rounded-full bg-card px-4 py-2 text-sm font-medium text-snow"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={stravaBusy}
                    onClick={startStravaOAuth}
                    className="rounded-full bg-[#fc4c02] px-4 py-2 text-sm font-medium text-white"
                  >
                    {stravaBusy ? "Connecting…" : "Connect with Strava"}
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setIntegrationConnected(meta.id, !on)}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    on ? "bg-card text-snow" : "bg-step text-ink"
                  }`}
                >
                  {on ? "Disconnect" : isStrava && !stravaLive ? "Demo connect" : "Connect"}
                </button>
              )}
            </div>
            <p className="mt-2 text-sm text-fog">{meta.blurb}</p>
            {isStrava && !stravaLive ? (
              <p className="mt-2 text-xs text-fog">
                Demo connect imports sample runs. Real OAuth (paid Strava API) is documented in{" "}
                <a
                  href="https://github.com/JackAsh23/All-in-One-fitness-App/blob/main/docs/STRAVA.md"
                  className="text-life underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  docs/STRAVA.md
                </a>{" "}
                for later.
              </p>
            ) : null}
            <p className="mt-2 text-xs text-fog">
              Syncs: {meta.syncs.join(", ")}
              {on && live?.lastSyncAt ? ` · ${relativeSyncTime(live.lastSyncAt)}` : ""}
            </p>
          </Card>
        );
      })}

      <Card>
        <h3 className="mb-3 font-semibold">Sync log</h3>
        {state.syncLog.length === 0 ? (
          <p className="text-sm text-fog">No sync events yet. Connect a source and tap Sync now.</p>
        ) : (
          <ul className="space-y-2">
            {state.syncLog.slice(0, 12).map((entry) => (
              <li key={entry.id} className="rounded-2xl bg-ink px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-fog">{relativeSyncTime(entry.at)}</span>
                  <span className="text-xs uppercase tracking-wide text-step">
                    {entry.source === "system" ? "System" : integrationMeta(entry.source as IntegrationId)?.name}
                  </span>
                </div>
                <p className="mt-1">{entry.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
