# ANDROID_BUILD.md

Flutter mobile app — build, signing, artifacts, CI.

## Toolchain

| Component | Version |
|-----------|---------|
| Flutter   | 3.47.2 (stable) |
| Dart      | 3.13.x |
| JDK       | 17 (Temurin) |
| Gradle    | 9.3.1 (wrapper) |
| AGP       | 9.1.0 |
| Kotlin    | 2.4.0 |
| compileSdk / targetSdk / minSdk | from `flutter.*` (Flutter defaults) |

Versions originate from the Flutter 3.47.2 template (`mobile/android/*.gradle.kts`)
and are internally consistent. See `COMPATIBILITY_MATRIX.md`.

## Build commands

```bash
cd mobile
flutter pub get
flutter build apk --release        # -> build/app/outputs/flutter-apk/app-release.apk
flutter build appbundle --release  # -> build/app/outputs/bundle/release/app-release.aab
```

### Local (sanctioned network) notes

pub.dev is blocked here, so **Dart** dependency resolution uses the China mirror
via env vars (these do NOT touch Gradle):

```bash
export PUB_HOSTED_URL=https://pub.flutter-io.cn
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
export GRADLE_USER_HOME='G:\gradle-home'
```

`android/settings.gradle.kts` and `android/build.gradle.kts` are the **unmodified
Flutter template** — `google()` + `mavenCentral()` only, no mirror repos. (Mirror
injection was tried and reverted: Flutter's plugin-loader enforces
PREFER_SETTINGS/FAIL_ON_PROJECT_REPOS and rejects injected project repos.)
A full local `flutter build apk` is therefore **env-blocked** on this machine
(dl.google.com sanctioned → cannot fetch NDK 28.2 / legacy plugin AGP); CI is
authoritative and green. See `CICD_EXPERIMENTS.md` #02–#04.

### connectivity_plus compileSdk (CI fix, Round 4)

`connectivity_plus` is pinned to `^6.1.5` (was `^5.0.2`). 5.x compiles its Android
module at `compileSdk 33`, which fails `:connectivity_plus:checkReleaseAarMetadata`
because its transitive androidx deps (fragment 1.7.1, window 1.2.0, activity 1.8.1, …)
require compileSdk ≥ 34. 6.1.5 uses `compileSdk 34`. The package is unused in app
code, so the major bump required no source changes. See `CICD_EXPERIMENTS.md` #10.

## Signing

The release build currently signs with the **debug** keystore (Flutter template
default in `android/app/build.gradle.kts`). This produces a genuine, installable
release-variant APK/AAB (R8/minification per the release build type), suitable for
CI validation and internal testing.

**Before store publication**, add a real upload key:
1. Generate a keystore (never commit it).
2. Store it as GitHub secrets (e.g. `ANDROID_KEYSTORE_BASE64`,
   `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`).
3. Add a `signingConfigs.release` block reading those secrets and point
   `buildTypes.release.signingConfig` at it.

## Artifacts (GitHub Actions)

| Artifact name         | Path                                                        |
|-----------------------|-------------------------------------------------------------|
| `android-release-apk` | `mobile/build/app/outputs/flutter-apk/app-release.apk`      |
| `android-release-aab` | `mobile/build/app/outputs/bundle/release/app-release.aab`   |

The `android` job verifies both files exist (fails otherwise — no
`continue-on-error`, no `|| true`) before uploading.

## CI workflow

`.github/workflows/build.yml` → job `android` on `ubuntu-latest`:
setup-java 17 → subosito/flutter-action 3.47.2 → `flutter pub get` →
`flutter analyze --no-pub --no-fatal-infos` → build APK → build AAB → verify → upload.

**Status: ✅ GREEN** (run 37233441499, commit 4a2d327). Both artifacts verified and
uploaded: `android-release-apk` 27.6 MB, `android-release-aab` 55.1 MB.

Note on `--no-fatal-infos`: Flutter 3.47.2 makes info-level diagnostics fatal by
default, so a plain `flutter analyze` exits 1 on the 21 info lints (deprecations,
prefer_const). `--no-fatal-infos` keeps errors + warnings fatal while allowing infos.
