# Release Current State

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
- No Git tag and no GitHub Release exists yet (`releases: 0`, `tags: []`), so nothing is
  downloadable by a user. Artifact generation is deliberately kept separate from publication.
- The Windows build is unsigned, so SmartScreen will warn on first launch.
- A release is not meaningful until the production backend is redeployed with the bearer-auth
  fix and its database is seeded; every shipped client currently fails to log in there.
- iOS is built unsigned; publishing needs a signing identity and App Store Connect access.

## Known Issues
- Deployment on the production server must always pass explicit `-f` and `--project-directory`
  to docker compose, otherwise it picks up the wrong stack in the parent directory.

## Next Steps
1. Redeploy the backend and seed production (operator decision).
2. Tag a release and attach the CI artifacts, or wire a publish job.
3. Add Windows code signing once a certificate exists.
4. Decide the auto-update channel for the desktop app.
