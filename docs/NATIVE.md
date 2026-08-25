# One Life — Native app (Capacitor)

Run the same React app inside iOS and Android shells.

## Prerequisites

| Platform | Tools |
|----------|--------|
| **iOS** | macOS, Xcode 15+, CocoaPods (optional with Capacitor 8 SPM) |
| **Android** | Android Studio, JDK 17+, Android SDK 34+ |

Install the CLI globally if you prefer: `npm install -g @capacitor/cli`

## Build and sync

After any web change:

```bash
npm run cap:sync
```

This runs `build:cap` (Vite with `base: './'`) and copies `dist/` into the native projects.

## Open in IDE

```bash
npm run cap:ios       # macOS + Xcode
npm run cap:android   # Android Studio
```

Then run on a simulator/emulator or a plugged-in device from the IDE.

## Live reload (optional)

Point the native app at your dev server while coding:

1. Start Vite: `npm run dev`
2. Find your machine IP (e.g. `192.168.1.10`)
3. In `capacitor.config.json`, temporarily set:

```json
"server": {
  "url": "http://192.168.1.10:5173",
  "cleartext": true
}
```

4. Run `npx cap copy` (no full rebuild needed for config-only changes on some platforms)
5. **Remove `server.url` before release builds**

## Release builds (Phase 1 checklist)

### iOS — TestFlight

1. Open `ios/App/App.xcworkspace` (or `.xcodeproj`) in Xcode
2. Set **Signing & Capabilities** → your Apple Developer team
3. Product → Archive → Distribute → App Store Connect → TestFlight
4. Bundle ID: `com.onelife.fitness`

### Android — internal testing

1. Open the `android/` folder in Android Studio
2. Build → Generate Signed Bundle / APK → Android App Bundle
3. Upload `.aab` to Google Play Console → Internal testing

## Build targets

| Command | Use |
|---------|-----|
| `npm run build` | Local web / default |
| `npm run build:pages` | GitHub Pages (`/All-in-One-fitness-App/`) |
| `npm run build:cap` | Capacitor native (`base: './'`) |

## Permissions (prepared for Phase 2)

- **Location** — Run tab GPS (Android manifest + iOS Info.plist usage strings)
- **Camera** — future barcode scan (add when implementing Phase 2)

## Troubleshooting

- **Blank screen on device** — run `npm run cap:sync` again; confirm `dist/index.html` uses relative `./assets/` paths
- **Routing broken on native** — we use `BrowserRouter` with no basename for Capacitor; avoid hard-coded absolute paths
- **Config not loading** — use `capacitor.config.json` (not `.ts`) if TypeScript 7 breaks the Capacitor CLI
