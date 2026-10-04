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

pub.dev is blocked here, so dependency resolution uses the China mirror:

```bash
export PUB_HOSTED_URL=https://pub.flutter-io.cn
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
export GRADLE_USER_HOME='G:\gradle-home'
```

`android/settings.gradle.kts` and `android/build.gradle.kts` keep `google()` /
`mavenCentral()` **first** and add Aliyun + Huawei mirrors only as fallbacks, so
GitHub Actions (clean network) resolves from the official repos and never needs
the mirrors.

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
`flutter analyze` → build APK → build AAB → verify → upload.
