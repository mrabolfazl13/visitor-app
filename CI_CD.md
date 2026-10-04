# CI_CD.md

GitHub Actions pipeline for the B2B Sales Platform.

Workflow: `.github/workflows/build.yml`
Triggers: `push` / `pull_request` on `master`/`main`, plus `workflow_dispatch`.

## Design principles (per mission constraints)

- **Independent jobs.** Each platform builds in its own job, so a failure on one
  never hides another's diagnostics and never blocks unrelated artifacts.
- **Honest failures.** No `continue-on-error`, no `|| true`, no swallowed exit
  codes. Every job has an explicit *Verify artifacts* step that `exit 1`s if the
  expected production file is missing.
- **Deterministic artifact names** and `if-no-files-found: error` on every upload.
- **Only supported targets are built** (see AGENTS.md platform matrix).

## Jobs

| Job | Runner | Produces | Artifact name(s) |
|-----|--------|----------|------------------|
| `frontend-web` | ubuntu-latest | Vite production build (`desktop/dist`) | `web-frontend-dist` |
| `android` | ubuntu-latest | release APK + AAB | `android-release-apk`, `android-release-aab` |
| `ios` | macos-latest | unsigned release `Runner.app` (zipped) | `ios-release-app` |
| `tauri-windows` | windows-latest | MSI + NSIS EXE | `tauri-windows-release` |
| `tauri-linux` | ubuntu-latest | AppImage + deb | `tauri-linux-release` |

macOS **desktop** is intentionally not built (not in the platform matrix; desktop
target is Windows). iOS is built unsigned because no signing secrets exist yet.

## Toolchain setup per job

- **Java:** `actions/setup-java@v4` Temurin 17 (Android).
- **Flutter:** `subosito/flutter-action@v2`, `flutter-version: 3.47.2`,
  `channel: stable`, `cache: true`.
- **Node:** `actions/setup-node@v4` node 20, npm cache keyed on
  `desktop/package-lock.json`.
- **Rust:** `dtolnay/rust-toolchain@stable` + `Swatinem/rust-cache@v2` scoped to
  `desktop/src-tauri -> target`.
- **Linux Tauri system libs:** webkit2gtk-4.1, xdo, ssl, ayatana-appindicator3,
  rsvg2, patchelf, build-essential.

## Secrets

None required for the current pipeline (Android/iOS use debug/unsigned builds,
desktop bundles are unsigned). To enable production signing, add:

- Android: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
  `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
- Windows/macOS desktop: code-signing certificates (optional).

## Release stage

Artifact generation and publication are kept separate (mission Phase 21). No
automatic GitHub Release is published yet; a `release` job can be added that
`needs:` the platform jobs and downloads their artifacts, once a signing key and
version/tag policy are decided.

## Local vs CI parity (Phase 7)

| Concern | Local (this machine) | GitHub runner |
|---------|----------------------|---------------|
| pub.dev | blocked (403) → China mirror | open |
| Maven/Google | mirrors as fallback | official `google()` first |
| NDK 28.2 (Flutter default) | not installed, download blocked | auto-downloaded |
| Rust release build | OOM (rustc killed) | builds normally |

Because of these, the **authoritative artifact build happens on CI**; local
builds are baselines only. The committed `ndkVersion = flutter.ndkVersion`
(28.2) is correct for CI. Local-only NDK pinning is never committed.
