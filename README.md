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

Open [http://localhost:5173](http://localhost:5173). The first load starts empty so you can track for real. Use **Reload demo year** on Profile if you want the sample 17-week history.

Run maps use a dark basemap. For MapTiler Streets Dark, copy `.env.example` to `.env.local`, add a free key from [MapTiler Cloud](https://cloud.maptiler.com/account/keys/), and restrict it to `http://localhost:5173/*` plus `https://jackash23.github.io/*`. GitHub Pages reads the same key from repo secret `VITE_MAPTILER_KEY`. Without a key the app falls back to CARTO Dark Matter (still dark, still free).

```bash
npm run build        # production build → dist/
npm run build:pages  # GitHub Pages base path
npm run build:cap    # Capacitor native (relative assets)
npm run preview      # serve dist/ on :4173
npm test             # Vitest unit tests
```

## What’s in this prototype

### v1.4 — Day-one use
- **Start fresh** — empty tracker for real logging; **Reload demo year** is optional
- **Updates keep your data** — Get latest does not restore the demo year over saved runs, food, or lifts
- Home CTAs, meal by time of day, leftover kcal/protein

### v1.2 — PWA + backup + barcode
- **PWA** — Add to Home Screen, offline shell, auto-updates
- **Profile** — Export / import JSON backup
- **Eat** — Open Food Facts barcode lookup + camera scan

### v1.3 — Capacitor + Strava OAuth
- **Native shell** — iOS + Android via Capacitor ([docs/NATIVE.md](docs/NATIVE.md))
- **Strava** — Real OAuth connect + activity import ([docs/STRAVA.md](docs/STRAVA.md))

### v1.1 — Polish + GPS, plans, food log
- **Run** — Walk mode, GPS permission gate, route planner, live map
- **Lift** — weekly training plans, **Exercise Gallery** (302 PNGs)
- **Eat** — Log food, barcode, meal scan, quick add
- **Stats** — Weight tab with trend line and calendar
- **Navigation** — header back on nested screens

Data stays on your device unless you connect Strava (OAuth tokens stored locally).

See [ROADMAP.md](ROADMAP.md) for v2 direction.

## Install on your phone (PWA)

1. Open **https://jackash23.github.io/All-in-One-fitness-App/** in Safari (iPhone) or Chrome (Android)
2. **Add to Home Screen**
3. Profile → **Get latest app version** after deploys (saved runs, food, and lifts stay on this phone)

## Native app (Capacitor)

```bash
npm run cap:sync      # build for native + copy dist/ into android/ and ios/
npm run cap:ios       # open Xcode (macOS)
npm run cap:android   # open Android Studio
```

Full setup: **[docs/NATIVE.md](docs/NATIVE.md)**

## Deploy

GitHub Pages builds on every push to `main`.

**First time only:** enable Pages in repo settings — see [`.github/DEPLOY_SETUP.md`](.github/DEPLOY_SETUP.md).

1. **Settings → Pages → Build and deployment → GitHub Actions**
2. Push to `main` (or re-run **Actions → Deploy Pages**)
3. App is served at **https://jackash23.github.io/All-in-One-fitness-App/**

Pull requests run build + tests via [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
