import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Card } from "./Heatmap";
import { connectedCount, integrationMeta } from "../lib/integrations";
import { relativeSyncTime } from "../lib/sync";
import { syncNow, useAppState } from "../lib/store";

export function SyncBanner() {
  const state = useAppState();
  const connected = state.integrations.filter((item) => item.connected);
  const count = connectedCount(state.integrations);
  const lastSync = connected.reduce<string | undefined>((latest, item) => {
    if (!item.lastSyncAt) return latest;
    if (!latest || item.lastSyncAt > latest) return item.lastSyncAt;
    return latest;
  }, undefined);

  if (count === 0) return null;

  return (
    <Card className="border-step/30 bg-step/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-step">Auto-sync {state.autoSync ? "on" : "off"}</p>
          <p className="mt-1 text-sm">
            {connected
              .map((item) => integrationMeta(item.id)?.name)
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="mt-1 text-xs text-fog">Last sync {relativeSyncTime(lastSync)}</p>
        </div>
        <button
          type="button"
          onClick={() => syncNow(false)}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-step"
          aria-label="Sync now"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      <Link to="/integrations" className="mt-2 inline-block text-xs text-fog hover:text-snow">
        Manage connections
      </Link>
    </Card>
  );
}
