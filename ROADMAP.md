# One Life Fitness — Roadmap

v1.1 prototype is feature-complete. This document records the chosen v2 direction and how simulated features become real.

## v2 direction (decided)

**Primary track: Capacitor native shell** — wrap the existing React UI and add real device APIs. This is the best fit for GPS runs, camera barcode scan, and HealthKit / Health Connect without rewriting every screen.

Secondary tracks (later):

| Track | When | Why |
|-------|------|-----|
| **PWA** | Shipped on web | Icons, offline shell, Add to Home Screen on GitHub Pages |
| **Backup + barcode** | Shipped on web | Profile export/import JSON; Open Food Facts barcode lookup |
| **Backend + accounts** | When multi-device sync is needed | Move `AppState` off pure `localStorage`; keep demo mode for guests |

Recommended order: **Capacitor → real integrations → optional cloud sync → optional PWA polish**.

## Phase 1 — Capacitor shell ✅ (in PR)

Done in this repo:

1. `@capacitor/core`, `@capacitor/cli`, iOS + Android projects (`android/`, `ios/`)
2. Capacitor `webDir` → Vite `dist/`; separate builds: `build:pages` (GitHub Pages), `build:cap` (`base: './'`)
3. Status bar + splash screen init on native launch
4. Location permission strings prepared for Run tab (Android manifest + iOS Info.plist)

**Your next steps (local):**

- Run `npm run cap:sync`, then open Xcode or Android Studio — see [docs/NATIVE.md](docs/NATIVE.md)
- Smoke-test all tabs in iOS Simulator and Android emulator
- Publish internal TestFlight / Play internal testing

**Phase 2 first files to touch:** [`src/pages/Run.tsx`](src/pages/Run.tsx), [`src/lib/geo.ts`](src/lib/geo.ts), [`src/pages/Integrations.tsx`](src/pages/Integrations.tsx), [`src/components/BarcodeSheet.tsx`](src/components/BarcodeSheet.tsx)

## Phase 2 — Replace simulated features

| Feature | v1.1 (today) | v2 implementation |
|---------|--------------|-------------------|
| **GPS runs** | Browser Geolocation API; no background tracking | `@capacitor/geolocation` + background location plugin; persist route polyline to store |
| **Integrations** | Toggle + fake sync in [`src/lib/sync.ts`](src/lib/sync.ts) | Strava OAuth + webhooks; HealthKit (iOS); Health Connect (Android); Garmin via API where available |
| **Barcode scan** | Text input demo in [`src/components/BarcodeSheet.tsx`](src/components/BarcodeSheet.tsx) | `@capacitor-mlkit/barcode-scanning` or `@capacitor/barcode-scanner`; Open Food Facts lookup |
| **Meal scan** | Demo recognizer in [`src/components/MealScanSheet.tsx`](src/components/MealScanSheet.tsx) | On-device vision (Core ML / ML Kit) or API with user consent |
| **Exercise art** | Local `/wg/` + CDN fallback in [`src/lib/exerciseArt.ts`](src/lib/exerciseArt.ts) | Already production-ready; keep CC BY-SA attribution |
| **Data** | `localStorage` + IndexedDB in [`src/lib/store.ts`](src/lib/store.ts) | Optional cloud sync later |

### Integration implementation notes

**Strava**

- OAuth 2.0 authorization code flow
- Scopes: `activity:read_all`
- Webhook for new activities → map to `RunLog` in store
- Dedupe by external activity id

**Apple Health (HealthKit)**

- Capacitor community plugin or custom native module
- Read: steps, workouts, distance; write: workouts after One Life finish
- Request permissions on Integrations connect

**Health Connect (Android)**

- Android 14+ Health Connect SDK via Capacitor bridge
- Same data types as HealthKit where possible

**Barcode**

- Camera permission gate (same pattern as Run GPS gate)
- Fallback manual entry retained for desktop web

## Phase 3 — Cloud sync (optional)

When you outgrow single-device storage:

1. Auth provider (Supabase Auth or Firebase Auth)
2. REST or realtime sync for `runs`, `workouts`, `foods`, `steps`, `weightLogs`, `profile`
3. Offline-first: local IndexedDB as source of truth, background sync queue
4. Export/import JSON backup on Profile (works without account)

## Phase 4 — Quality

- Expand Vitest coverage ([`src/lib/scoring.test.ts`](src/lib/scoring.test.ts), store migrations)
- PR CI: build + test (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml))
- Optional: ESLint + `react/no-nested-components` rules
- Optional: route-based code splitting for Leaflet and Wrapped

## Out of scope for v2 (unless requirements change)

- Full React Native rewrite (Capacitor reuses ~95% of current UI)
- Social feed / leaderboards (needs backend first)
- Paid subscriptions / coach marketplace
