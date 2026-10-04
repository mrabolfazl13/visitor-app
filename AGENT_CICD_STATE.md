# AGENT_CICD_STATE.md — CI/CD Build & Release Recovery

_Last updated: 2026-10-04_

## Mission
Make the production CI/CD pipeline genuinely build and verify real artifacts for
every supported platform (Android via Flutter; Desktop via Tauri), driven by
GitHub Actions. Execution task — fix root causes, do not hide failures.

## Repository
- Path: I:/Codes/Hamid  (local, Windows)
- Remote: https://github.com/mrabolfazl13/visitor-app.git  (branch: master, repo currently EMPTY — no refs pushed yet)
- Credential helper: manager (push expected to work)
- gh CLI: NOT installed → use GitHub REST API via python+urllib with a token for run monitoring.

## Detected platforms (verified, not assumed)
| Platform | Exists? | Evidence |
|---|---|---|
| Flutter/Android | YES | mobile/pubspec.yaml, mobile/lib/**, but mobile/android + mobile/ios are EMPTY dirs |
| Tauri desktop | YES | desktop/src-tauri/{Cargo.toml,tauri.conf.json,src/main.rs}, desktop/{package.json,vite.config.ts,index.html} |
| Frontend (Vite/React/TS) | YES | desktop is the Vite app (React 18 + TS + Vite 5) |
| Backend (FastAPI) | YES | backend/ (not a CI artifact target for this mission) |
| GitHub Actions | NO | no .github/ dir yet |

## Local toolchain
Flutter 3.47.2 · Dart 3.13.2 · Java 17.0.19 · cargo/rustc 1.96.1 · node 24.13.0 · npm 11.6.2
NOTE (env memory): Rust RELEASE builds OOM on this machine → do NOT run `tauri build`/release cargo locally; validate Rust on GH runners. Flutter/Android local build is OK (use Maven mirrors per memory).

## Current build blockers (initial discovery)
### Mobile (Flutter)
1. main.dart uses GoRouter/GoRoute but does NOT import package:go_router → compile error.
2. mobile/android and mobile/ios are empty → no platform project → `flutter build apk` impossible until generated.
3. pubspec declares assets/fonts/Vazirmatn-{Regular,Medium,Bold}.ttf, assets/images/, assets/icons/ — ALL missing → build error.
4. theme.dart references Vazirmatn font family.

### Desktop (Tauri 2)
1. src-tauri/build.rs MISSING (tauri_build not invoked) → build failure.
2. bundle icons referenced in tauri.conf.json but icons/ dir absent (32x32.png,128x128.png,128x128@2x.png,icon.ico,icon.icns).
3. capabilities/ dir empty → plugins have no permissions.
4. package.json has duplicate "zustand" key (malformed-ish).

## Plan / next actions
- [x] Fix mobile compile blockers (analyze clean: 0 errors).
- [x] `flutter create` android/ios platform projects; add real Vazirmatn fonts.
- [x] Fix desktop blockers: build.rs, icons, capabilities/default.json, dedupe package.json,
      remove unused React import (App.tsx), generate Cargo.lock.
- [x] Frontend `npm run build` verified locally (dist emitted, exit 0).
- [x] Author .github/workflows/build.yml: frontend-web, android, ios, tauri-windows, tauri-linux.
- [x] Commit → first push to origin (repo empty) → trigger Actions.
- [x] Monitor runs via GitHub REST API, read real runner logs, iterate to green verified artifacts.

## ✅ MISSION COMPLETE — Round 4 (run 37233441499, commit 4a2d327)
ALL 5 jobs `completed/success`; ALL 6 artifacts verified + uploaded (if-no-files-found: error):
| Artifact | Size | Contents |
|---|---|---|
| web-frontend-dist | 143 KB | Vite dist |
| android-release-apk | 27.6 MB | release APK |
| android-release-aab | 55.1 MB | Play App Bundle |
| ios-release-app | 8.4 MB | unsigned Runner.app |
| tauri-windows-release | 7.1 MB | MSI + NSIS |
| tauri-linux-release | 88.8 MB | AppImage + deb |

CI iteration history (real runner logs, no failure hiding — Phase 25 respected):
- Round 1 (37221299078): android ❌ invalid `--fatal-infos=false` syntax; tauri-windows ❌ WiX `fa-IR` culture panic.
- Round 2 (37222341303): android ❌ `flutter analyze` still exit 1 (3.47.2 makes infos fatal by default).
- Round 3 (37223417342): android ❌ at Gradle `:connectivity_plus:checkReleaseAarMetadata` (plugin compileSdk 33 vs androidx needing 34). First 4/5 green (windows/linux/ios/frontend).
- Round 4 (37233441499): android ✅ after `connectivity_plus ^5.0.2 → ^6.1.5` (compileSdk 34). 5/5 GREEN.
Root-cause fixes are logged in CICD_EXPERIMENTS.md #01–#10.

## Local build baseline (Phase 6) — result
- Frontend (Vite/tsc): SUCCESS locally → dist/ emitted.
- Cargo.lock: SUCCESS locally (resolution only) → 536 pkgs, tauri 2.12.1.
- Android APK: BLOCKED locally — NOT a code defect. Causes: (1) sanctioned dl.google.com
  blocks NDK 28.2 (Flutter default) + legacy plugin AGP 8.1.2 downloads; (2) local SDK is
  degraded (corrupt NDK 27 v4 package.xml, empty NDK 30 package.xml, garbage .knownPackages);
  (3) mirror injection conflicts with Flutter plugin-loader PREFER_SETTINGS repo mode.
  → Committed Android config reverted to the Flutter-generated template (CI-correct);
    only `-Xmx4G` kept (from 8G) for runner memory safety. See CICD_EXPERIMENTS.md #02–#04.
- Tauri native bundle (cargo build): deferred to CI — local rustc release OOMs (env memory).

## Build status
| Target | Local | CI (authoritative) |
|---|---|---|
| Web (Vite) | ✅ verified | ✅ green (run 37233441499) |
| Android APK/AAB | ⛔ env-blocked | ✅ green — APK 27.6 MB + AAB 55.1 MB |
| iOS (unsigned) | n/a (no macOS) | ✅ green — Runner.app 8.4 MB |
| Tauri Windows | ⛔ rustc OOM | ✅ green — MSI + NSIS 7.1 MB |
| Tauri Linux | ⛔ rustc OOM | ✅ green — AppImage + deb 88.8 MB |
| GitHub Actions | workflow authored | ✅ 5/5 jobs success, 6 artifacts uploaded |

Local remains env-blocked for Android (sanctioned dl.google.com) and Tauri (rustc release OOM);
CI is authoritative (Phase 7) and is fully green.

