# ⚡ Fast Launch Plan — TWA (Android) + Capacitor (Android/iOS)

**Repository:** `martial-arts-manager`  
**Date:** 2026-02-16  
**Goal:** publish fast mobile versions from the existing mobile-first web app.

---

## 1) What was already prepared in this repo

This repository now includes:

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/offline.html`
- `public/.well-known/assetlinks.json` (template)
- `capacitor.config.ts`
- `src/lib/registerServiceWorker.ts`
- `package.json` scripts for Capacitor + Bubblewrap TWA
- `index.html` with manifest/apple/mobile meta tags

---

## 2) Launch strategy (fastest + safest)

### Android fast path (Store-ready): **TWA**
- App opens your production web in fullscreen.
- Best speed-to-market for Android.
- Uses Chrome engine and Digital Asset Links verification.

### iOS + optional Android shell: **Capacitor**
- Packages web into native projects.
- Gives `.ipa` path for iOS and optional `.apk/.aab` path for Android.
- Good backup if TWA constraints arise.

### Android quick start without store: **Direct APK download**
- Show in-app popup after login on `hamarr.cl`.
- Download APK directly from `/downloads/hamarr-app-latest.apk`.
- No Play Console required for initial rollout.

---

## 3) Prerequisites

- Node + pnpm
- Android Studio + SDK + JDK 17+
- Xcode (for iOS builds)
- Play Console + App Store Connect accounts
- Production domain with HTTPS (currently expected: `https://hamarr.cl`)

---

## 4) One-time setup checklist (required)

1. Replace placeholder in `public/.well-known/assetlinks.json`:
   - `package_name`
   - release certificate SHA-256 fingerprint

2. Ensure app icons exist in production-ready sizes (recommended PNG):
   - 192x192
   - 512x512
   - maskable 512x512 (recommended)

3. Keep `manifest.webmanifest` metadata aligned with final app naming.

4. Deploy web changes first so TWA validation can read:
   - `/.well-known/assetlinks.json`
   - `/manifest.webmanifest`
   - `/sw.js`

---

## 5) Fast commands for this repo

> Run from project root.

### Install dependencies
- `pnpm install`

### Build web bundle
- `pnpm mobile:web:build`

### Capacitor sync + open native IDE projects
- `pnpm mobile:cap:android`
- `pnpm mobile:cap:ios`

### TWA flow helpers
- `pnpm mobile:twa:doctor`
- `pnpm mobile:twa:init`
- `pnpm mobile:twa:build`

---

## 6) Android TWA release flow

1. Deploy latest web to production.
2. Verify URLs are reachable publicly:
   - `https://hamarr.cl/manifest.webmanifest`
   - `https://hamarr.cl/.well-known/assetlinks.json`
3. Run TWA init/build scripts.
4. Open generated Android project and sign release.
5. Publish `.aab` to Play internal testing first.

### TWA acceptance checks
- Opens fullscreen without browser URL bar.
- Correct domain verification (no fallback custom tab for verified flow).
- Login, attendance QR, profile avatar upload all functional.

---

## 7) Capacitor iOS release flow

1. Build web bundle (`pnpm mobile:web:build`).
2. Sync (`pnpm mobile:cap:ios`).
3. Open Xcode project and configure:
   - Bundle ID
   - Team signing
   - App name/icons/splash
4. Archive and upload to TestFlight.
5. Validate auth/session and camera-based flows.

---

## 8) Capacitor Android fallback/parallel flow

1. Build + sync (`pnpm mobile:cap:android`).
2. Open Android Studio project.
3. Configure signing + app id if needed.
4. Generate `.aab` and upload to Play testing track.

---

## 9) Repository-specific risks and mitigations

### R1: Auth refresh behavior in wrappers
- Current web flow relies on refresh cookie.
- Mitigation: validate cookie behavior in WebView contexts early; if unstable, add mobile token fallback endpoint.

### R2: Store review quality threshold
- Thin wrappers can be flagged.
- Mitigation: add native value quickly (push/deeplink/offline UX enhancements) in next iteration.

### R3: PWA icon quality for TWA
- Placeholder JPEG icons may pass initial checks but are not ideal.
- Mitigation: replace with production PNG set before final release.

---

## 10) 4-week execution plan (fast launch)

## Week 1
- Complete prerequisites + replace placeholders.
- Deploy PWA assets and verify installability.

## Week 2
- TWA internal Android build + Play internal test.
- Capacitor iOS shell build and TestFlight internal run.

## Week 3
- Fix auth/camera/session edge cases from pilot users.
- Improve app icons, store metadata, privacy declarations.

## Week 4
- Release candidate sign-off.
- Publish Android and iOS staged rollout.

---

## 11) Definition of done (fast launch)

- Android app available in Play testing as TWA (or Capacitor fallback).
- iOS app available in TestFlight via Capacitor.
- Core flows validated on mobile:
  - login/register/logout
  - attendance QR
  - student profile/avatar
  - classes + notifications
- Crash and session metrics baseline captured.

---

## 12) Immediate next action

Run:
1. `pnpm install`
2. `pnpm mobile:web:build`
3. `pnpm mobile:twa:doctor`

Then proceed with `mobile:twa:init` and `mobile:cap:ios`.
