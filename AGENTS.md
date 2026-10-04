# AGENTS.md - Autonomous Agentic Team Guidelines

## Architecture

- **Mobile**: Flutter + Dart (Riverpod, GoRouter, Material 3) - Clean Architecture + Feature-first
- **Backend**: FastAPI + SQLAlchemy 2 + PostgreSQL + Redis + Celery
- **Desktop Windows**: Tauri 2.x + Vite + React + TypeScript + Rust
- **Storage**: MinIO for product images, PostgreSQL for metadata
- **Local DB**: Drift (SQLite) for offline mode on mobile, SQLite via Tauri for desktop
- **Infrastructure**: Docker Compose (postgres, redis, backend, celery_worker, celery_beat, minio)

## Agent Responsibilities

### Agent 1 — Architecture / Tech Lead
- System Architecture, Domain Architecture, Database Architecture
- API Contract, Security Architecture, Offline/Sync Architecture
- State Machines, ADR, Dependency Management

### Agent 2 — Backend / Core
- FastAPI, SQLAlchemy 2, PostgreSQL, Alembic
- Authentication, Authorization, RBAC
- Products, Customers, Orders, Inventory, Accounting, Shipping, Reports
- Audit Logs, API v1 endpoints with pagination/filter/sort/search

### Agent 3 — Flutter / Frontend (Mobile)
- Flutter, Dart, Riverpod, GoRouter, Material 3
- UI/UX, Navigation, Product Management, Seller Experience
- Customer Management, Orders, Dashboard, Reports
- Search, Filters, Forms, Image Upload, RTL support

### Agent 4 — Desktop Windows
- Tauri 2.x, Vite, React, TypeScript, Zustand
- Desktop-first UI/UX, Keyboard shortcuts, Global search
- Native capabilities via Tauri commands
- Windows installer (MSI/NSIS), Auto-update architecture

### Agent 5 — Offline / Sync
- Local Database (Drift/SQLite), Offline Cache
- Sync Queue, Retry with Exponential Backoff
- Conflict Resolution, Idempotency, Optimistic UI
- Sync Status, Connectivity Handling

### Agent 6 — QA / Testing
- Unit Tests, Integration Tests, API Tests
- Widget Tests (Flutter), E2E Tests
- Offline Tests, Sync Tests, Concurrency Tests
- Permission Tests, Inventory Tests

### Agent 7 — Data / Storage
- PostgreSQL schema, Indexes, Migrations (Alembic)
- MinIO setup, Image Processing, Object Storage
- Seed Data (1 Admin, 10 Sellers, 100 Products, 100 Customers)

### Agent 8 — Performance / Security / Release
- Performance optimization, Security hardening
- JWT, Rate Limiting, Docker, CI/CD
- Android Build, iOS Configuration, Windows Build
- Release Validation

## Coding Rules

- No TODO, Coming Soon, Fake APIs, Mock Production Data
- All features must be production-ready
- Business logic stays in Backend (FastAPI)
- Mobile and Desktop consume same API
- Type safety: TypeScript strict mode, Dart strong typing
- No `any` in TypeScript unless absolutely necessary
- Persian/RTL support from day one
- Modern UI/UX: Material 3, clean cards, excellent spacing, smooth animations

## Database Rules

- Transaction-safe inventory operations with row-level locking
- Soft delete using `deleted_at` for appropriate entities
- Price snapshot in order_items (unit_price at order time)
- Idempotency keys for all sensitive mutations
- Audit logs for all critical actions
- Proper indexing on foreign keys and frequently queried fields

## API Rules

- Versioned: `/api/v1/`
- Full OpenAPI documentation
- Collections support: pagination, filter, sort, search
- Proper HTTP status codes
- Error messages in Persian for user-facing errors
- JWT authentication with refresh tokens
- Role-based authorization enforced at API level

## Testing Rules

### Mandatory Tests
- **Inventory**: 10 stock → 7 order → 3 remaining
- **Overselling**: 5 stock, A=4, B=3 → no negative stock
- **Offline**: Create customer/order offline → online → sync
- **Duplicate**: Same operation sent twice → no duplicate
- **Permissions**: Seller cannot change price/stock/create product/approve order
- **Workflow**: Order cannot go to accounting without approval

### Coverage
- Backend: pytest + pytest-asyncio
- Flutter: Unit, Widget, Integration tests
- Desktop: Component tests, E2E tests
- Offline/Sync: Stress testing with concurrent operations

## Git Rules

- Commit after each completed phase
- Descriptive commit messages in English
- No secrets or credentials in repository
- `.env.example` provided, actual `.env` in .gitignore
- Branch per major feature if needed

## Current State

See `current-state/` directory for detailed progress:
- `architecture.md` - System design and decisions
- `backend.md` - Backend implementation status
- `flutter.md` - Mobile app status
- `desktop.md` - Windows desktop app status
- `offline-sync.md` - Offline and sync implementation
- `qa.md` - Testing and quality assurance
- `release.md` - Build and release status

## Known Issues

(Will be updated as issues are discovered and resolved)

## Platform Matrix

| Platform        | Technology                        | Status   |
| --------------- | --------------------------------- | -------- |
| Android         | Flutter                           | Required |
| iOS             | Flutter                           | Required |
| Windows         | Tauri + Vite + React + TypeScript | Required |
| Backend         | FastAPI                           | Required |
| Database        | PostgreSQL                        | Required |
| Cache/Queue     | Redis                             | Required |
| Background Jobs | Celery                            | Required |
| Object Storage  | MinIO                             | Required |

## VERSION 1 Definition

Version 1 is complete only when ALL of these are working:
- Authentication + RBAC
- Admin + Seller + Customer Management
- Product Management + Image Upload
- Cart + Orders + Approval Workflow
- Accounting + Invoice + Payment
- Inventory + Warehouse + Shipping
- Reports + Dashboard
- Offline Mode + Sync + Conflict Resolution
- Audit Log + Notifications Architecture
- Security + Testing + Docker
- Documentation + Android Build + iOS Config + Windows Build
