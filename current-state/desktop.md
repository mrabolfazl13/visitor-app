# Desktop Windows Current State

Windows console: Tauri 2 + Vite 5 + React 18 + TypeScript 5 (strict) + Zustand + TanStack Query 5.
It is a real client of `/api/v1`; there are no mock records and no placeholder screens.

## Completed
- ✅ Rust bridge (`src-tauri/src/`): `api_request` runs HTTP through reqwest so the WebView
  never depends on CORS, `kv_set`/`kv_get`/`kv_del` persist session tokens in a rusqlite
  (bundled) store under `app_data_dir()/desktop-state.db`.
- ✅ Data layer (`src/services/`): typed API clients for auth/products/customers/categories,
  bearer token injection, single-flight refresh with one retry, Persian error mapping
  (401/403/404/409/422/5xx), `Page<T>` pagination envelopes.
- ✅ Session store (`src/stores/auth.ts`): bootstraps from the kv store, restores via
  `GET /auth/me`, clears on logout and on unrecoverable 401.
- ✅ Screens: login, dashboard, products, customers, profile. Products and customers support
  server-side search, filters, sort and pagination, create/edit/delete (admin only),
  detail modals, and delete confirmation.
- ✅ Global search: `Ctrl+K` palette over products and customers; a hit either opens the
  detail modal (row not on screen) or scrolls to and flashes the matching row.
- ✅ Shortcuts: `Ctrl+K` palette, `Ctrl+B` sidebar, `Ctrl+1..4` navigation, suppressed while typing.
- ✅ Design system: hand-written CSS token layer (`src/index.css`), RTL via `dir="rtl"` and
  logical properties, Jalali dates and `fa-IR` numerals, toasts, fixed shell with an
  internally scrolling content column.
- ✅ Verified against a real PostgreSQL + FastAPI stack at 1440x900: login, dashboard
  (۱۰۰ کالا / ۱۰۰ مشتری / ۹٬۰۵۰ واحد / ۵٬۲۶٬۲۵ تومان derived from the API), product table
  (20 rows/page, 7 sortable columns), palette to detail modal, seller session showing 10
  scoped customers and no admin actions, zero console errors.

## In Progress
- 🔄 CI confirmation of the Rust compile (Windows MSI/NSIS + Linux AppImage/deb jobs).

## Blocked
- Orders, accounting, inventory and report screens are not built: the backend has no
  routers for them yet, and AGENTS.md forbids inventing client-side APIs for them.
- Product images: `POST /products/{id}/images` still returns 501, so the detail modal
  reports "بدون تصویر". Needs MinIO service work first.

## Known Issues
- None open. The `overflowX` reading seen during early probes was the 0x0 headless
  viewport, not a layout defect; at 1440x900 `document.scrollWidth` equals the viewport.

## Tests
- `npm run build` (tsc strict + Vite) passes: 261 KB JS, 16.5 KB CSS.
- UI verified through the shipped code path in headless Edge over CDP at 1440x900
  (screenshots plus geometry: shell 1440x900, sidebar 232x900, content scroll container
  scrolls while the topbar and nav stay fixed).

## Next Steps
1. Confirm the Tauri Windows and Linux artifacts from CI.
2. Re-point the default API base URL once the backend auth fix is deployed to production.
3. Add orders and inventory screens when their routers exist.
4. Wire image upload to the MinIO endpoint when it is implemented.
5. Package the Windows installer and try auto-update.
