# Strava OAuth — setup checklist for JackAsh23

Connect your real Strava account in **Integrations → Connect with Strava**.

The app also shows this checklist on the Integrations screen until OAuth is configured.

---

## Step 1 — Strava API app (~2 min)

1. Open **[strava.com/settings/api](https://www.strava.com/settings/api)**
2. Click **Create an app** (or use an existing one)
3. Fill in:

| Field | Value |
|-------|--------|
| **Application name** | One Life Fitness |
| **Category** | Training |
| **Website** | `https://jackash23.github.io/All-in-One-fitness-App/` |
| **Authorization Callback Domain** | `jackash23.github.io` |

4. Save and copy:
   - **Client ID** (number)
   - **Client Secret** (click Show)

> Strava uses the callback **domain** only. The full redirect URI is sent by One Life at connect time:
> `https://jackash23.github.io/All-in-One-fitness-App/integrations`

---

## Step 2 — Cloudflare Worker proxy (~3 min)

The client secret cannot ship in the public website. A free Cloudflare Worker exchanges the OAuth code for tokens.

1. Create a free account at [dash.cloudflare.com](https://dash.cloudflare.com)
2. On your PC, in the repo folder:

```bash
npm install
npx wrangler login
npx wrangler secret put STRAVA_CLIENT_ID      # paste Client ID
npx wrangler secret put STRAVA_CLIENT_SECRET  # paste Client Secret
npm run deploy:strava-worker
```

3. Copy the URL Wrangler prints, e.g. `https://one-life-strava.your-name.workers.dev`

---

## Step 3 — GitHub secrets (~1 min)

1. Open **github.com/JackAsh23/All-in-One-fitness-App → Settings → Secrets and variables → Actions**
2. Add **New repository secret** for each:

| Name | Value |
|------|--------|
| `VITE_STRAVA_CLIENT_ID` | Strava Client ID |
| `VITE_STRAVA_TOKEN_PROXY` | Worker URL from step 2 (no trailing slash) |

3. Go to **Actions → Deploy Pages → Re-run all jobs** (or push any commit to `main`)

---

## Step 4 — On your iPhone

1. Wait for deploy (~1–2 min)
2. Open the app → **Profile → Get latest app version**
3. **Integrations** — orange setup card should disappear; **Connect with Strava** appears
4. Authorize on Strava → tap **Sync now**
5. Check **Run** tab for imported activities

---

## Local dev (optional)

Create `.env.local` in the repo root:

```env
VITE_STRAVA_CLIENT_ID=your_client_id
VITE_STRAVA_TOKEN_PROXY=https://your-worker.workers.dev
```

Run `npm run dev` and use redirect `http://localhost:5173/integrations` (add `localhost` as a second callback domain in Strava if needed).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Still see orange setup card | Secrets missing or Pages not redeployed after adding secrets |
| “Strava login failed (state mismatch)” | Try Connect again; don’t open Strava callback in a new tab |
| “Token exchange failed” | Worker secrets wrong; run `wrangler tail` while connecting |
| Redirect error on Strava | Callback domain must be `jackash23.github.io` |
| Connect works, no runs | Activity must be Run/Walk/Hike; check Sync log on Integrations |

---

## Security notes

- Client secret lives only in Cloudflare Worker secrets and GitHub Actions (for Client ID only in build)
- Strava tokens stay in your phone’s `localStorage`
- Disconnect Strava on Integrations to revoke local tokens
