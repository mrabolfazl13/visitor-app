# TAURI_BUILD.md

Desktop app — Tauri 2 + Vite + React + TypeScript + Rust.

## Toolchain

| Component | Version |
|-----------|---------|
| Node      | 20 |
| npm       | lockfile-driven (`npm ci`, `desktop/package-lock.json`) |
| Rust      | stable (dtolnay/rust-toolchain) |
| Tauri     | 2.0.0 |
| tauri-build | 2.0.0 |
| Vite      | 5 |
| TypeScript| 5.3 |

Tauri plugins (Rust + JS, all 2.0.0): `shell`, `fs`, `dialog`, `notification`.

## Key files

- `desktop/src-tauri/tauri.conf.json` — productName `B2B Sales Platform`,
  identifier `com.b2bsales.desktop`, version `1.0.0`, `bundle.targets: "all"`,
  `frontendDist: "../dist"`, `beforeBuildCommand: "npm run build"`.
- `desktop/src-tauri/build.rs` — `tauri_build::build()` (required by Tauri 2).
- `desktop/src-tauri/capabilities/default.json` — grants `core:default` +
  shell/fs/dialog/notification defaults to the `main` window.
- `desktop/src-tauri/icons/` — 32x32.png, 128x128.png, 128x128@2x.png,
  icon.png, icon.ico, icon.icns.
- `desktop/src-tauri/src/main.rs` — Tauri 2 Builder registering the 4 plugins.

## Build commands

```bash
cd desktop
npm ci
npm run build          # tsc && vite build -> desktop/dist
npm run tauri:build    # full native bundle (runs `npm run build` first)
```

`tauri build` outputs into `desktop/src-tauri/target/release/bundle/`.

### Local (this machine) constraints

Rust **release** builds OOM here (`rustc` killed: "memory allocation failed").
Locally validate with `cargo check` + `npm run build` only; produce the real
native bundle on GitHub runners. If a local release build is unavoidable, use
`-j1` and reduced `opt-level` (see project memory).

## Platform system dependencies

**Linux (ubuntu-latest):**
```
libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev
libssl-dev libayatana-appindicator3-dev librsvg2-dev patchelf
```

**Windows (windows-latest):** MSVC + WebView2 preinstalled on the runner.
WiX (MSI) and NSIS are fetched automatically by the Tauri bundler.

**macOS:** not a required desktop target for this project (AGENTS.md platform
matrix lists Windows only for desktop); no macOS desktop job is run.

## Artifacts (GitHub Actions)

| Artifact name           | Contents |
|-------------------------|----------|
| `tauri-windows-release` | `bundle/msi/*.msi`, `bundle/nsis/*.exe` |
| `tauri-linux-release`   | `bundle/appimage/*.AppImage`, `bundle/deb/*.deb` |
| `web-frontend-dist`     | `desktop/dist` (Vite production build) |

Each Tauri job verifies its expected bundle files exist before uploading.

## CI workflow

`.github/workflows/build.yml` → jobs `frontend-web`, `tauri-windows`,
`tauri-linux`. Rust builds are cached with `Swatinem/rust-cache` scoped to
`desktop/src-tauri -> target`.
