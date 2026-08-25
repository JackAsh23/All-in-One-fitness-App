import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Card } from "../components/Heatmap";
import {
  STRAVA_CALLBACK_DOMAIN,
  STRAVA_REDIRECT_URI_PROD,
  copyText,
  stravaSetupStatus,
} from "../lib/strava";

export function StravaSetupCard() {
  const status = stravaSetupStatus();
  const [copied, setCopied] = useState<string | null>(null);

  if (status.ready) return null;

  async function handleCopy(label: string, value: string) {
    const ok = await copyText(value);
    if (ok) {
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    }
  }

  return (
    <Card className="border-[#fc4c02]/30 bg-[#fc4c02]/5">
      <h3 className="font-semibold text-[#fc4c02]">Set up real Strava (5 min)</h3>
      <p className="mt-1 text-sm text-fog">
        Demo connect works without this. Real Strava needs a <strong className="text-snow">Strava subscription</strong> (Standard
        Tier API) plus the steps below.
      </p>

      <ol className="mt-4 space-y-3 text-sm">
        <li className="rounded-2xl bg-ink px-3 py-3">
          <p className="font-medium">1. Create Strava API app</p>
          <a
            href="https://www.strava.com/settings/api"
            target="_blank"
            rel="noreferrer"
            className="text-life underline"
          >
            strava.com/settings/api
          </a>
          <p className="mt-2 text-xs text-fog">
            Callback domain: <span className="font-mono text-snow">{STRAVA_CALLBACK_DOMAIN}</span>
          </p>
          <CopyRow
            value={STRAVA_REDIRECT_URI_PROD}
            copied={copied === "redirect"}
            onCopy={() => void handleCopy("redirect", STRAVA_REDIRECT_URI_PROD)}
          />
        </li>

        <li className="rounded-2xl bg-ink px-3 py-3">
          <p className="font-medium">2. Deploy token proxy (Cloudflare, free)</p>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-card p-2 text-[11px] text-fog">
            {`npx wrangler login
npx wrangler secret put STRAVA_CLIENT_ID
npx wrangler secret put STRAVA_CLIENT_SECRET
npm run deploy:strava-worker`}
          </pre>
          <p className="mt-2 text-xs text-fog">Copy the worker URL (ends in .workers.dev)</p>
        </li>

        <li className="rounded-2xl bg-ink px-3 py-3">
          <p className="font-medium">3. GitHub repo secrets</p>
          <p className="mt-1 text-xs text-fog">
            Repo → Settings → Secrets and variables → Actions → New repository secret
          </p>
          <ul className="mt-2 space-y-1 font-mono text-[11px] text-snow">
            <li>VITE_STRAVA_CLIENT_ID</li>
            <li>VITE_STRAVA_TOKEN_PROXY</li>
          </ul>
          <p className="mt-2 text-xs text-fog">Re-run Deploy Pages, then Profile → Get latest app version</p>
        </li>
      </ol>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <StatusPill ok={status.hasClientId} label="Client ID in build" />
        <StatusPill ok={status.hasProxy} label="Token proxy in build" />
      </div>

      <a
        href="https://github.com/JackAsh23/All-in-One-fitness-App/blob/main/docs/STRAVA.md"
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block text-xs text-life underline"
      >
        Full guide: docs/STRAVA.md
      </a>
    </Card>
  );
}

function CopyRow({
  value,
  copied,
  onCopy,
}: {
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className="mt-2 flex w-full items-center gap-2 rounded-xl bg-card px-2 py-2 text-left text-[11px]"
    >
      <span className="min-w-0 flex-1 truncate font-mono text-snow">{value}</span>
      {copied ? <Check size={14} className="shrink-0 text-life" /> : <Copy size={14} className="shrink-0 text-fog" />}
    </button>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`rounded-full px-2 py-1 ${ok ? "bg-life/15 text-life" : "bg-card text-fog"}`}>
      {ok ? "✓" : "○"} {label}
    </span>
  );
}
