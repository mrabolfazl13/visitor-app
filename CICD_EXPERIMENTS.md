# CICD_EXPERIMENTS.md

Every meaningful build experiment is recorded here. Never repeat a conclusively failed experiment.

Format: Platform · Hypothesis · Change · Command · Result · Conclusion

---

## Experiment #01 — Mobile analyze
Platform: Flutter/Android
Hypothesis: 3 compile errors block any build (missing go_router import, undefined
`apiServiceProvider`, undefined `AppTheme.bodySmall`, `MyApp` in test).
Change:
- main.dart: added `import 'package:go_router/go_router.dart';`
- customer_provider.dart / product_provider.dart: added `import 'auth_provider.dart';`
- theme.dart: added `static const TextStyle bodySmall`
- test/widget_test.dart: replaced `MyApp` smoke test with a valid MaterialApp test
Command: `flutter analyze --no-pub`
Result: SUCCESS — 0 errors (21 info-level lints remain: withOpacity/background deprecations, prefer_const).
Conclusion: Dart code compiles. Info lints are non-fatal for `flutter build`.

## Experiment #02 — Local APK build #1 (default NDK)
Platform: Flutter/Android (local)
Hypothesis: `flutter build apk --release` works locally with default toolchain.
Change: none.
Command: `flutter build apk --release` (PUB/FLUTTER mirror env, GRADLE_USER_HOME=G:\gradle-home)
Result: FAILED — `sdkmanager.bat` exit 1 configuring `:app`.
Evidence: Flutter 3.47.2 default `ndkVersion = 28.2.13676358` is NOT installed
(have 21.4/25.2/27.0/30.0); plugin tries to download it from dl.google.com → blocked (sanctions).
Conclusion: Local env cannot fetch Google-hosted NDK. Not a code defect.

## Experiment #03 — Local APK build #2 (pin installed NDK 25.2)
Platform: Flutter/Android (local)
Hypothesis: Pinning `ndkVersion = "25.2.9519653"` (installed + valid package.xml) avoids the download.
Change: temp edit app/build.gradle.kts ndkVersion.
Command: `flutter build apk --release`
Result: FAILED (different error) — `:connectivity_plus` could not resolve
`com.android.tools.build:gradle:8.1.2` (dl.google.com blocked) → cascading
"kotlin-android requires an Android Gradle plugin" + AGP-9 newDsl hint.
Conclusion: Legacy plugin's own buildscript needs Google Maven; local network blocks it.
NDK pin DID clear the NDK error (progress). Root local blocker = sanctioned dl.google.com.

## Experiment #04 — Local APK build #3 (global mirror init script)
Platform: Flutter/Android (local)
Hypothesis: A GRADLE_USER_HOME init script injecting Aliyun/Huawei mirrors into all
buildscripts lets connectivity_plus resolve AGP 8.1.2 locally.
Change: created G:\gradle-home\init.d\mirrors.gradle (allprojects + settingsEvaluated pluginManagement).
Command: `flutter build apk --release`
Result: FAILED — "Build was configured to prefer settings repositories over project
repositories but repository 'maven' was added by settings file". The Flutter
plugin-loader (`includeBuild flutter_tools/gradle`) enforces PREFER_SETTINGS /
FAIL_ON_PROJECT_REPOS, so injected project-level repos are rejected.
Conclusion: Mirror injection fights Flutter's plugin-loader repository mode. Not worth
pursuing — local Android is environmentally blocked (sanctions + degraded SDK:
corrupt NDK 27 v4 package.xml, empty NDK 30 package.xml, garbage .knownPackages).
Action: init script DELETED; all local-only/mirror edits REVERTED so committed Android
config == Flutter-generated template (known-good for CI). Kept only `-Xmx4G` (from 8G)
in gradle.properties as a CI-runner memory-safety improvement.

## Experiment #05 — Frontend (Vite/tsc) build
Platform: Desktop frontend
Hypothesis: `npm run build` (tsc && vite build) succeeds.
Change: none initially.
Command: `npm run build`
Result: FAILED — `src/App.tsx(1,1): error TS6133: 'React' is declared but never read`
(jsx: react-jsx automatic runtime + noUnusedLocals).
Fix: removed unused `import React from 'react'` from App.tsx (main.tsx keeps it — uses React.StrictMode).
Command: `npm run build`
Result: SUCCESS — dist/index.html + assets/index-*.js (143 kB) + css emitted, exit 0.
Conclusion: Frontend production build clean. Validates `frontend-web` job and the
`beforeBuildCommand` half of `tauri build`.

## Experiment #06 — Cargo.lock generation
Platform: Tauri (Rust)
Hypothesis: crates.io is reachable for metadata resolution (no compilation → no OOM),
so a deterministic Cargo.lock can be committed.
Change: none.
Command: `cargo generate-lockfile` (in desktop/src-tauri)
Result: SUCCESS — 536 packages locked. tauri 2.12.1, tauri-build 2.7.1,
plugin-shell 2.4.0 / fs 2.6.0 / dialog 2.8.1 / notification 2.5.1, reqwest 0.11.27, rusqlite 0.30.0.
Conclusion: Lock committed for reproducible CI builds. Full `cargo build`/`tauri build`
still deferred to CI runners (local rustc release OOMs per env memory).

---

## CI Round 1 — run 37221299078 (first push, branch master)
Jobs: `frontend-web` ✅ · `ios` ✅ · `tauri-linux` ✅ (AppImage + deb) · `android` ❌ · `tauri-windows` ❌

### Experiment #07 — Android `Analyze` step failed
Platform: Android (CI, ubuntu-latest)
Hypothesis: The analyze gate uses an invalid boolean-flag syntax.
Evidence: failed step #7 "Analyze (errors are fatal)"; locally `flutter analyze --no-pub` passed with only infos.
Root cause: workflow ran `flutter analyze --no-pub --fatal-infos=false`. Flutter uses package:args;
boolean flags are `--fatal-infos` / `--no-fatal-infos`, NOT `--fatal-infos=false` → usage error → non-zero exit.
Fix: changed step to `flutter analyze --no-pub` (default fatal-warnings=true, fatal-infos=false → infos don't fail).
Conclusion: CI-only syntax bug, not a code defect. (Gradle/APK stage was never reached.)

### Experiment #08 — Tauri Windows `Build Tauri app` failed (WiX culture)
Platform: Tauri Windows (CI, windows-latest)
Evidence (real runner log): Rust release binary compiled fine; failure at MSI packaging —
`thread panicked at tauri-bundler/src/bundle/windows/msi/mod.rs:836: Language fa-IR not found.
It must be one of ... en-US, ar-SA, he-IL, tr-TR ...` (WiX supports a fixed culture list; Persian is absent).
Root cause: `tauri.conf.json` → `bundle.windows.wix.language: "fa-IR"` is not a valid WiX culture.
Fix: set `wix.language` to `en-US`. App UI stays Persian/RTL; only the Windows installer wizard
language changes (Persian installer was never supported by WiX). Non-destructive (Phase 24).
Note: Tauri Linux succeeded because AppImage/deb don't use WiX.

## CI Round 2 — pending
Pushed fixes: #07 (analyze flag) + #08 (wix language). Watching: does the Android **Gradle/APK**
stage succeed on CI? Watch for an AGP version conflict (app AGP 9.1.0 vs connectivity_plus buildscript
AGP 8.1.2). If it fails, apply single-AGP unification (resolutionStrategy) or bump connectivity_plus.

