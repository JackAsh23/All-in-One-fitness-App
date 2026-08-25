# One Life — Fitness OS

Move. Train. Eat. See your consistency.

Interactive prototype of an all-in-one fitness dashboard: running, strength, Filipino-first nutrition, and GitHub-style activity heatmaps.

## Live demo

**https://jackash23.github.io/All-in-One-fitness-App/**

Open on your phone and hard-refresh if you still see an old build (Safari: pull down; Chrome: hold refresh → “Empty cache and hard reload”).

Deployed automatically from `main` via GitHub Pages (see [Deploy](#deploy)).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The first load seeds ~17 weeks of demo data in `localStorage` so the heatmaps look alive. Use **Reload demo year** on Profile to reset.

```bash
npm run build    # production build → dist/
npm run preview  # serve dist/ on :4173
npm test         # Vitest unit tests
```

## What’s in this prototype

### v0.1 — Personal tracker
- **Home** — consistency score, streak, timeline, macros, steps
- **Run** — simulated run + quick log, stats, history
- **Workout** — templates, set logging, rest timer
- **Nutrition** — macro bars, Filipino food search
- **Consistency** — GitHub-style heatmaps
- **Profile** — goals and score priorities

### v0.2 — Heatmaps & analytics
- Monthly summaries, streak tracking, tap-a-day breakdown

### v0.3 — Automation & integrations (simulated)
- **Integrations** — Apple Health, Health Connect, Strava, Garmin
- **Auto-sync** — background pull for steps and imported runs

### v0.4 — Smart nutrition
- Barcode scan, recent/favorites, saved meals, portion steppers

### v1.0 — Consistency OS
- **Goal modes** — Balanced, Marathon block, Strength focus, Cut phase
- **Consistency OS hub** — dynamic score pillars, streak labels, monthly recaps
- **One Life Wrapped** — Spotify-style yearly recap at `/wrapped`

### v1.1 — Polish + GPS, plans, food log
- **Home** — fuel rings no longer overlap kcal / protein labels
- **Run** — Walk mode, GPS permission gate, route planner, live Strava-style map
- **Lift** — weekly training plans, **Exercise Gallery** (302 PNGs from `@bryllim/workout-guide`)
- **Eat** — **Log food** at the top, meal **+** buttons, floating **+**, four modes: Search, Barcode Scan, Meal Scan, Quick ADD
- **Stats** — dedicated Weight tab with trend line, 7/30-day change, weigh-in calendar
- **OS** — run / lift / eat heatmaps use distinct colors
- **Navigation** — header back on Profile, Integrations, Exercise Gallery, Wrapped, live sessions, and run overlays

Data never leaves the browser. No accounts yet.

See [ROADMAP.md](ROADMAP.md) for v2 direction (Capacitor, real device APIs, cloud sync).

### Install on your phone (PWA)

1. Open **https://jackash23.github.io/All-in-One-fitness-App/** in Safari (iPhone) or Chrome (Android)
2. **Add to Home Screen** — the app runs standalone with offline shell caching
3. After updates deploy, reopen the app once to pick up the latest service worker

Icons and offline cache work on the GitHub Pages build (`npm run build:pages`).

**Backup:** Profile → Export backup (JSON). Import on a new phone after Add to Home Screen.

**Barcode:** Eat → Barcode Scan → camera or type digits → Open Food Facts lookup (demo barcodes use local Filipino foods).

## Deploy

GitHub Pages builds on every push to `main`.

**First time only:** enable Pages in repo settings — see [`.github/DEPLOY_SETUP.md`](.github/DEPLOY_SETUP.md).

1. **Settings → Pages → Build and deployment → GitHub Actions**
2. Push to `main` (or re-run **Actions → Deploy Pages**)
3. App is served at **https://jackash23.github.io/All-in-One-fitness-App/**

The build uses base path `/All-in-One-fitness-App/` ([`vite.config.ts`](vite.config.ts)).

Pull requests run build + tests via [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
