# Strava OAuth setup

One Life imports your Strava runs after you connect on **Integrations → Strava**.

Strava requires a **client secret** for token exchange, which cannot live in the public GitHub Pages app. Use a tiny proxy (Cloudflare Worker, free tier).

## 1. Create a Strava API application

1. Go to [https://www.strava.com/settings/api](https://www.strava.com/settings/api)
2. Create an app
3. Set **Authorization Callback Domain** to `jackash23.github.io` (or `localhost` for dev)
4. Note your **Client ID** and **Client Secret**

## 2. Deploy the token proxy (Cloudflare Worker)

```bash
npm install -g wrangler
wrangler secret put STRAVA_CLIENT_ID
wrangler secret put STRAVA_CLIENT_SECRET
wrangler deploy workers/strava-token.js
```

Copy the worker URL (e.g. `https://one-life-strava.your-subdomain.workers.dev`).

## 3. Configure the web app build

Add GitHub repository secrets (Settings → Secrets → Actions):

| Secret | Value |
|--------|--------|
| `VITE_STRAVA_CLIENT_ID` | Your Strava Client ID |
| `VITE_STRAVA_TOKEN_PROXY` | Worker URL from step 2 |

Redeploy GitHub Pages (push to `main` or re-run **Deploy Pages**).

For local dev, create `.env.local`:

```env
VITE_STRAVA_CLIENT_ID=your_client_id
VITE_STRAVA_TOKEN_PROXY=https://your-worker.workers.dev
```

## 4. Register redirect URIs in Strava

Add these **exact** redirect URIs in your Strava app settings:

- `https://jackash23.github.io/All-in-One-fitness-App/integrations`
- `http://localhost:5173/integrations` (local dev)

## 5. Connect in the app

1. Open **Integrations**
2. Tap **Connect with Strava**
3. Authorize on Strava — you return to One Life
4. Tap **Sync now** to import recent runs

Tokens are stored in `localStorage` on your device only.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| “Strava is not configured” | Add secrets and redeploy |
| Redirect mismatch | Callback URI must match exactly (including `/All-in-One-fitness-App/`) |
| Token exchange failed | Check worker logs; verify client secret |
| No runs imported | Strava activity must be Run/Walk/Hike type; check Sync log |
