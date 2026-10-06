# QA Current State

Honest inventory of automated and scripted verification. AGENTS.md lists mandatory
scenario tests (inventory, overselling, offline sync, duplicates, permissions, workflow);
most of them cannot exist yet because the features they cover are not implemented.

## Completed
- ✅ CI compiles every shipped target on push: Vite/TS strict build, Flutter analyze +
  Android APK/AAB + iOS (unsigned), Tauri Windows (MSI/NSIS) and Tauri Linux (AppImage/deb).
- ✅ Backend behaviour proven over live HTTP against a real PostgreSQL (throwaway pgserver
  instance, not a mock): bearer auth, refresh, `GET /auth/me`, product and customer CRUD,
  401/403/404/409/422 paths, and seller data scoping (a seller sees only its own customers
  and cannot create products).
- ✅ Desktop UI proven through the shipped code path in headless Edge over CDP at 1440x900:
  login, dashboard figures derived from the API, product table (20 rows/page, 7 sortable
  columns, server search/filter/sort/pagination), `Ctrl+K` palette to detail modal,
  profile page, seller session (10 scoped customers, no admin actions), zero console errors.
- ✅ Desktop CRUD round-trip proven in the UI: create product → row appears → edit price →
  soft delete with confirmation → row disappears; create customer → duplicate mobile
  surfaces the Persian 409 message → invalid mobile surfaces the client-side validation
  message → delete. Probe rows were cleaned up afterwards.
- ✅ Layout contracts measured, not assumed: shell 1440x900, sidebar 232x900, content is the
  only scroller (`window.scrollY` stays 0), no element extends past the viewport.
- ✅ One Flutter widget test exists (`mobile/test/widget_test.dart`) — it only proves a frame
  renders.

## In Progress
- 🔄 Nothing.

## Blocked
- No pytest suite in `backend/` and no pytest step in CI, so the backend proofs above are
  manual and will not regress-test.
- Inventory, overselling, order-workflow and offline-sync scenario tests are impossible until
  those routers exist.
- CI runs `flutter analyze` but never `flutter test`, so the Flutter widget test does not run
  in CI.
- No desktop component or E2E tests are wired into CI; the CDP probes used for this session
  live outside the repository.

## Known Issues
- Open: the production backend predates the bearer-auth fix and its database is empty, so no
  client can log in there.
- Resolved this session: modals did not close on Escape; horizontal overflow reported by the
  hidden in-app browser turned out to be a 0x0 viewport artifact, disproved at 1440x900.

## Next Steps
1. Add a backend pytest suite (auth, RBAC, CRUD, pagination envelopes) and a CI job for it.
2. Run `flutter test` in CI.
3. Move the CDP desktop probes into a repeatable script under `desktop/` and gate them in CI.
4. Write the mandatory scenario tests as their features land.
