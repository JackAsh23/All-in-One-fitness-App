# One Life — Fitness OS

Move. Train. Eat. See your consistency.

Interactive prototype of an all-in-one fitness dashboard: running, strength, Filipino-first nutrition, and GitHub-style activity heatmaps.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The first load seeds ~17 weeks of demo data in `localStorage` so the heatmaps look alive. Use **Reload demo year** on Profile to reset.

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

### v1.1 — Polish + GPS, plans, food log
- **Home** — fuel rings no longer overlap kcal / protein labels
- **Run** — Walk mode, GPS permission gate, route planner, live Strava-style map
- **Lift** — weekly training plans with prescribed sets, workout-guide PNGs
- **Eat** — floating + log button (Search, Barcode, Meal scan, Quick add), food calendar, weight + target
- **Stats** — dedicated Weight tab with trend line, 7/30-day change, weigh-in calendar
- **OS** — run / lift / eat heatmaps use distinct colors

### v1.0 — Consistency OS
- **Goal modes** — Balanced, Marathon block, Strength focus, Cut phase
- **Consistency OS hub** — dynamic score pillars, streak labels, monthly recaps
- **One Life Wrapped** — Spotify-style yearly recap at `/wrapped`

Data never leaves the browser. No accounts yet.
