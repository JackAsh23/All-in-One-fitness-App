# One Life — Fitness OS

Move. Train. Eat. See your consistency.

Interactive prototype of an all-in-one fitness dashboard: running, strength, Filipino-first nutrition, and GitHub-style activity heatmaps.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The first load seeds ~17 weeks of demo data in `localStorage` so the heatmaps look alive. Use **Reload demo year** on Profile to reset.

## What’s in this prototype (v0.1 + v0.2)

- **Home** — today’s consistency score, streak, timeline, macros, steps
- **Run** — live simulated run + quick log, weekly/monthly stats, history
- **Workout** — templates (upper/lower/push/pull/full/calisthenics/custom), set logging, rest timer
- **Nutrition** — calorie/macro bars, meal sections, Philippine food search (adobo, kwek-kwek, Jollibee, 7-Eleven…)
- **Consistency** — unified heatmap plus run / workout / meal graphs
- **Profile** — goals and score priorities (don’t punish a runner for skipping bench)

Data never leaves the browser. No accounts, GPS hardware, or HealthKit yet — those are later roadmap phases.
