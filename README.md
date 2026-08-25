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
- **Barcode scan** — Jollibee, McDo, 7-Eleven, Filipino staples
- **Recent & favorites** — one-tap re-log and starred foods
- **Saved meals** — log a whole plate; save today’s lunch as a template
- **Portion stepper** — adjust grams on logged items
- **Category filters** — Filipino, Restaurants, Convenience, etc.

Data never leaves the browser. No accounts yet.
