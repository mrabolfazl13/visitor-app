# COMPATIBILITY_MATRIX.md

Versions detected in-repo and the toolchain pinned for CI. When a version changes, record the compatibility reason in AGENT_CICD_STATE.md.

## Frontend / Desktop (Vite + React + TS)
- Node: 20 (CI) — package.json engines unspecified; Vite 5 + TS 5.3 supported on Node 20 LTS.
- Package manager: npm (package-lock.json present).
- Vite: ^5.0.11
- React: ^18.2.0
- TypeScript: ^5.3.3
- Build command: `npm ci && npm run build` (tsc && vite build)

## Tauri
- Tauri: `2.0.0` declared → **resolved 2.12.1** in committed Cargo.lock (caret picks latest 2.x)
- tauri-build: `2.0.0` declared → resolved 2.7.1
- Plugins (resolved): shell 2.4.0, fs 2.6.0, dialog 2.8.1, notification 2.5.1
- Other resolved: reqwest 0.11.27, rusqlite 0.30.0 (bundled), tokio 1.x, serde 1.x
- Rust: stable (CI: dtolnay/rust-toolchain@stable); local 1.96.1
- Cargo.lock: **committed** (536 packages) → deterministic CI builds
- Bundle identifier: com.b2bsales.desktop
- productName: B2B Sales Platform
- version: 1.0.0
- Targets: `all` → Windows (msi/nsis), Linux (appimage/deb/rpm), macOS (app/dmg)
- WebView2: required on Windows (bundled via tauri on windows-latest)

## Android (Flutter)
Verified from Flutter 3.47.2 template (`mobile/android/*.gradle.kts`) + the SDK's own
`DependencyVersionChecker.kt` support policy:
- Flutter: 3.47.2 (local) → CI `subosito/flutter-action@v2` pinned `flutter-version: 3.47.2`, channel stable
- Dart: 3.13.2
- JDK: 17 (Temurin) — Flutter policy: Java error/warn threshold = 17
- Gradle: 9.3.1 (wrapper) — policy: error < 8.14.0, warn < 9.1.0 → 9.3.1 OK
- AGP: 9.1.0 — policy: error < 8.11.1, warn < 9.0.1 → 9.1.0 OK (all app-level versions in range)
- Kotlin (KGP): 2.4.0 — policy: error < 2.2.20, warn < 2.3.20 → 2.4.0 OK
- compileSdk 36 / targetSdk 36 / minSdk 24 (Flutter 3.47.2 defaults via `flutter.*`)
- NDK: `flutter.ndkVersion` = **28.2.13676358** (committed default; auto-downloaded on CI)
- gradle.properties jvmargs: `-Xmx4G` (lowered from template's 8G for runner memory safety)
- Legacy-plugin note: `connectivity_plus` pins AGP 8.1.2 in its own buildscript — resolves
  fine on CI (clean google()); it was the local sanctioned-network blocker, not a config defect.
- Key deps: flutter_riverpod ^2.4.9, go_router ^13.0.0, dio ^5.4.0, drift ^2.14.0, sqlite3_flutter_libs ^0.5.18, shared_preferences ^2.2.2, cached_network_image ^3.3.0, connectivity_plus ^6.1.5 (bumped from ^5.0.2 — 5.x pins compileSdk 33, which fails checkReleaseAarMetadata against androidx deps needing 34; 6.1.5 uses compileSdk 34), intl ^0.20.3

