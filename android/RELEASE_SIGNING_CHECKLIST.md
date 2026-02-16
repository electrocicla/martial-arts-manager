# 🔐 Android Release Signing Checklist (Direct APK Distribution)

Use this checklist to produce a **production-signed APK** for direct download from `hamarr.cl`.

---

## 1) Prepare keystore (one-time)

1. Create a release keystore (`.jks`) in a secure location (outside git).
2. Backup keystore and passwords in your secrets manager.
3. Never commit keystore files or passwords.

---

## 2) Configure signing properties

1. Copy:
   - `android/keystore.properties.example` -> `android/keystore.properties`
2. Fill real values:
   - `storeFile`
   - `storePassword`
   - `keyAlias`
   - `keyPassword`

> `android/.gitignore` already excludes `keystore.properties` and `*.jks`.

---

## 3) Build release APK

From project root:

1. Sync latest web/app changes:
   - `pnpm mobile:cap:sync:android`
2. Build release APK:
   - `cd android`
   - `./gradlew assembleRelease` (Linux/macOS)
   - `gradlew.bat assembleRelease` (Windows)

Expected artifact:

- `android/app/build/outputs/apk/release/app-release.apk`

---

## 4) Verify signature and integrity

1. Check signing info with `apksigner verify --print-certs app-release.apk`.
2. Record SHA-256 checksum and keep it for support/verification.
3. Smoke test install on at least 2 real Android devices.

---

## 5) Publish for direct download

1. Copy release APK to:
   - `public/downloads/hamarr-app-latest.apk`
2. Build/deploy web.
3. Validate URL:
   - `https://hamarr.cl/downloads/hamarr-app-latest.apk`

---

## 6) Post-release checks

- Login from Android browser at `hamarr.cl`.
- Confirm APK popup appears after successful login.
- Download/install APK.
- Confirm app opens `https://hamarr.cl` and session persists after relaunch.

---

## 7) Safety notes

- If `keystore.properties` is missing, build currently falls back to debug signing for convenience.
- **Do not distribute debug-signed APK** to production users.
- Rotate internal release process documentation if keystore ownership changes.
