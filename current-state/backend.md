# Backend Current State

FastAPI + SQLAlchemy 2 (async) + PostgreSQL + Redis + Celery + MinIO.

## Completed
- ✅ Async app factory, Alembic-ready SQLAlchemy 2 models, soft deletes, audit-friendly columns.
- ✅ Auth: `OAuth2PasswordBearer` wired through `Security()` so `Authorization: Bearer` is both
  documented in OpenAPI and actually enforced (`app/api/deps.py`); a `?token=` fallback stays for
  legacy clients. Roles are eager-loaded with `selectinload` because `user.role_names` is read
  after commit, where an implicit load raises `MissingGreenlet`.
- ✅ `GET /auth/me` returns the authenticated user so clients can restore a session on startup;
  `POST /auth/change-password` now takes the current user from the token instead of an
  unauthenticated query parameter.
- ✅ Typed list envelopes: `Page[T]` (`app/schemas/common.py`) with `PaginationMeta`, so
  `/products` and `/customers` serialize ORM rows and document their item type.
- ✅ Mutations re-read the row after flush because server-side `onupdate=now()` expires
  `updated_at`; previously every PUT failed response validation.
- ✅ CRUD: products, customers (owner-scoped for sellers), categories (`app/api/categories.py`).
- ✅ RBAC enforced at the router with `require_role(...)`, verified live: a seller cannot create
  products, cannot read another owner's customer, and sees only its own customers.
- ✅ Verified against a real PostgreSQL instance: login, refresh, `/auth/me`, bearer-protected
  list/create/update/delete, 401/403/404/409/422 paths, seller scoping.

## In Progress
- 🔄 Nothing in flight.

## Blocked
- `POST /products/{product_id}/images` raises 501: there is no MinIO storage service yet, so
  product images have no upload path and `ProductImage` rows are never created.
- Orders, inventory, accounting, shipping and report routers do not exist, so no client can use them.

## Known Issues
- Production still runs the pre-fix `deps.py`, so bearer tokens are ignored there. The desktop
  and mobile clients cannot authenticate against production until this is redeployed.
- The production database has no seed data; `scripts/seed.py` (1 admin, 10 sellers, 100 products,
  100 customers) has not been run against it.

## Tests
- `pytest` suite exists for the earlier phases; the auth/RBAC/scoping behaviour above was
  additionally proven over live HTTP against a temporary PostgreSQL (pgserver) instance.

## Next Steps
1. Redeploy the backend so the bearer-auth fix reaches production.
2. Seed production data.
3. Implement MinIO storage service plus product image upload and public URLs.
4. Build orders, inventory and accounting routers with their workflow tests.
