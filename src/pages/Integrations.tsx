import { RefreshCw } from "lucide-react";
import { Card } from "../components/Heatmap";
import { INTEGRATION_CATALOG, integrationMeta } from "../lib/integrations";
import { relativeSyncTime } from "../lib/sync";
import { setAutoSync, setIntegrationConnected, syncNow, useAppState } from "../lib/store";
import type { IntegrationId } from "../lib/types";

export function IntegrationsPage() {
  const state = useAppState();
  const connected = state.integrations.filter((item) => item.connected).length;

  return (
    <div className="space-y-4 animate-pop">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-step">Phase 3</p>
        <h2 className="text-2xl font-semibold">Integrations</h2>
      </div>

      <Card>
        <p className="text-sm text-fog">
          One Life becomes your central dashboard. Connect wearables and running apps — this prototype simulates real
          sync until native HealthKit / Health Connect ships.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-ink px-3 py-3">
          <div>
            <p className="font-medium">Background auto-sync</p>
            <p className="text-xs text-fog">Pulls steps & runs every ~90s when connected</p>
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
          onClick={() => syncNow(false)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-life py-3 font-semibold text-ink"
        >
          <RefreshCw size={16} />
          Sync now
        </button>
        <p className="mt-2 text-center text-xs text-fog">
          {connected} connected · last activity {relativeSyncTime(state.syncLog[0]?.at)}
        </p>
      </Card>

      {INTEGRATION_CATALOG.map((meta) => {
        const live = state.integrations.find((item) => item.id === meta.id);
        const on = live?.connected ?? false;
        return (
          <Card key={meta.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl">{meta.emoji}</p>
                <h3 className="font-semibold">{meta.name}</h3>
                <p className="text-xs text-fog">{meta.platform}</p>
              </div>
              <button
                type="button"
                onClick={() => setIntegrationConnected(meta.id, !on)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  on ? "bg-card text-fog" : "bg-step text-ink"
                }`}
              >
                {on ? "Disconnect" : "Connect"}
              </button>
            </div>
            <p className="mt-2 text-sm text-fog">{meta.blurb}</p>
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
