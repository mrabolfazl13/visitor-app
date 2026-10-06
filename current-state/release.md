# Release Current State

## Published
- ✅ GitHub Release **v0.1.0** (prerelease) at
  <https://github.com/mrabolfazl13/visitor-app/releases/tag/v0.1.0> (prerelease, 1 release / 1 tag total), tagged on commit
  `3fedd39` and fed entirely by CI run `37426869056` (5/5 jobs green). Artifact generation in
  Actions and publication by this script are deliberately two separate steps.
- Eight public assets:

  | Asset | Bytes |
  | --- | --- |
  | `windows-B2B_Sales_Platform_0.1.0_x64_en-US.msi` | 6 156 288 |
  | `windows-B2B_Sales_Platform_0.1.0_x64-setup.exe` | 4 356 144 |
  | `linux-B2B_Sales_Platform_0.1.0_amd64.AppImage` | 86 051 320 |
  | `linux-B2B_Sales_Platform_0.1.0_amd64.deb` | 7 685 800 |
  | `android-app-release.apk` (`versionName 0.1.0+1`) | 58 897 197 |
  | `android-app-release.aab` | 55 389 453 |
  | `ios-unsigned-Runner.app.zip` (unsigned, review only) | 8 418 086 |
  | `web-frontend-dist.zip` | 372 212 |

- ✅ Client versions unified on `0.1.0` (`desktop/package.json`, `desktop/package-lock.json`,
  `desktop/src-tauri/tauri.conf.json`, `desktop/src-tauri/Cargo.toml`, `mobile/pubspec.yaml`).
  `1.0.0` would have claimed the AGENTS.md VERSION 1 milestone, which the backend does not meet.

## Completed
- ✅ Docker Compose stack for postgres, redis, backend, celery worker/beat and MinIO;
  `.env.example` present, real `.env` gitignored.
- ✅ Unified edge topology on the production server: one nginx front for four subdomains,
  shared postgres/redis/minio, and the data stores no longer exposed to the internet.
- ✅ CI builds every target on push (`.github/workflows/build.yml`, 5 jobs, all green) and
  publishes six artifacts per run:
  | Artifact | Size |
  | --- | --- |
  | android-release-aab | 55 MB |
  | android-release-apk | 27.6 MB |
  | tauri-linux-release (AppImage + deb) | 93 MB |
  | tauri-windows-release (MSI + NSIS) | 10.3 MB |
  | ios-release-app (unsigned) | 8.4 MB |
  | web-frontend-dist | 0.4 MB |

## In Progress
- 🔄 Nothing.

## Blocked
- The Windows build is unsigned, so SmartScreen will warn on first launch.
- iOS is built unsigned; publishing needs a signing identity and App Store Connect access.
- **Production cannot be logged into at all**, for two independent reasons measured on 2026-10-07:
  - `https://visitor.absadeghi.ir` never answers over TLS. `GET https://visitor.absadeghi.ir/cdn-cgi/trace`
    — a request Cloudflare's edge serves without touching the origin — times out after 15-25 s and the
    connection resets, while the identical request over `http://` returns instantly
    (`h=visitor.absadeghi.ir, colo=FRA`) and `https://school.absadeghi.ir/cdn-cgi/trace` returns a full
    trace from the same client. The origin itself is fine for that name:
    `curl --resolve visitor.absadeghi.ir:443:2.189.255.225 https://visitor.absadeghi.ir/api/v1/categories`
    → `404` (FastAPI's own) in 0.95 s. So the break is the edge certificate / SSL mode recorded for
    *that* hostname, and no app or nginx change will make it reachable. Both clients ship
    `https://visitor.absadeghi.ir/api/v1` as the default base URL, so a fresh install reaches nothing.
  - The production `b2b_sales` database is empty: `select count(*)` → **0 users, 0 products** (the 20
    tables exist, the schema is deployed). Every credential therefore returns
    `401 Incorrect email or password`, even on the working `http://` path. Seeding must not reuse the
    published `seed.py` defaults.

## Known Issues
- `smart-school-edge` is the only listener on host `:443` for the whole server. It was found
  `Exited (0)` on 2026-10-07 (HTTPS was dead for every subdomain at that point) and was restarted; it is
  not health-checked by anything, so re-verify `ss -ltn | grep 443` after any edge/compose operation.
- Deployment on the production server must always pass explicit `-f` and `--project-directory`
  to docker compose, otherwise it picks up the wrong stack in the parent directory.
- The repository is now **public**, so these published defaults are readable by anyone:
  - `backend/scripts/seed.py` hard-codes weak seed passwords (`admin123`, `seller{i}123`,
    `acct{i}123`, `wh{i}123`, `ship{i}123`). Production must never be seeded with these.
  - `docker-compose.prod.yml` and `deploy-simple.sh` carry a literal
    `super-secret-jwt-key-change-in-production` fallback for `JWT_SECRET`; deploying with the
    fallback (instead of an injected value) would publish a signing key in a public repo.
- Verified as **not** leaked by going public: the live `JWT_SECRET` inside the `b2b_backend`
  container is neither that literal nor its published `$(date +%s)` recipe (43 characters, and it
  does not match the recipe prefix), and no 48+ hex string has ever been committed
  (`git rev-list --objects --all` scan returned zero candidates). `_unified/` and `.env` stay
  untracked.

## Next Steps
1. Rotate/replace the seed password defaults before any production seed (operator decision).
2. Replace the `JWT_SECRET` fallback in `docker-compose.prod.yml` with a fail-fast
   `${JWT_SECRET:?}` so the public default can never be used.
3. Restore HTTPS for `visitor.absadeghi.ir` at Cloudflare (edge certificate / SSL mode for that
   hostname), then re-check `https://visitor.absadeghi.ir/cdn-cgi/trace` from a client.
4. Redeploy the backend with `5370712` and seed production with non-default credentials (operator
   decision) — until 3 and 4 are done the released clients have no server to log into.
5. Add Windows code signing once a certificate exists.
6. Decide the auto-update channel for the desktop app.
