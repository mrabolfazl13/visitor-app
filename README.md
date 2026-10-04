# B2B Sales, Customer, Inventory & Order Management Platform

A comprehensive B2B platform for managing products, sellers, customers, orders, inventory, accounting, and shipping with offline-first capabilities across Android, iOS, and Windows Desktop.

## Tech Stack

### Mobile (Android/iOS)
- **Flutter** + Dart
- **Riverpod** for state management
- **GoRouter** for navigation
- **Material 3** design system
- **Drift** for local offline database

### Backend
- **FastAPI** (Python)
- **SQLAlchemy 2** ORM
- **PostgreSQL** database
- **Redis** for caching and Celery broker
- **Celery** for background jobs
- **Alembic** for migrations
- **MinIO** for object storage (product images)

### Desktop (Windows)
- **Tauri 2.x** for native desktop
- **Vite** + **React** + **TypeScript**
- **Zustand** for state management
- **SQLite** for local offline database

### Infrastructure
- **Docker Compose** for development and deployment
- Services: PostgreSQL, Redis, Backend, Celery Worker, Celery Beat, MinIO

## Features

- ✅ Multi-role system (Admin, Seller, Accountant, Warehouse, Shipper)
- ✅ Product management with image upload
- ✅ Customer management with ownership
- ✅ Order workflow with approval states
- ✅ Accounting with invoices and payments
- ✅ Inventory management with transaction safety
- ✅ Warehouse operations
- ✅ Shipping with tracking
- ✅ Comprehensive reports and dashboards
- ✅ Offline-first architecture with sync queue
- ✅ Conflict resolution and idempotency
- ✅ Audit logging
- ✅ RTL and Persian language support
- ✅ Modern, responsive UI/UX

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Flutter SDK (for mobile development)
- Node.js 18+ (for desktop development)
- Rust (for Tauri desktop builds)

### Development Setup

1. Clone the repository
```bash
git clone <repository-url>
cd b2b-sales-platform
```

2. Configure environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start infrastructure
```bash
docker compose up -d
```

4. Run backend migrations and seed data
```bash
cd backend
alembic upgrade head
python scripts/seed.py
```

5. Run mobile app
```bash
cd mobile
flutter pub get
flutter run
```

6. Run desktop app
```bash
cd desktop
npm install
npm run tauri dev
```

## Project Structure

```
project/
├── mobile/              # Flutter mobile app
│   ├── lib/
│   ├── android/
│   └── ios/
├── backend/             # FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── tests/
│   └── alembic/
├── desktop/             # Tauri desktop app
│   ├── src/
│   ├── src-tauri/
│   └── package.json
├── infrastructure/      # Docker and deployment configs
├── current-state/       # Progress tracking
├── docker-compose.yml
├── AGENTS.md            # Team guidelines
└── README.md
```

## Documentation

- [Architecture](ARCHITECTURE.md)
- [API Documentation](API.md)
- [Database Schema](DATABASE.md)
- [Offline Sync](OFFLINE_SYNC.md)
- [Security](SECURITY.md)
- [Deployment](DEPLOYMENT.md)
- [Testing](TESTING.md)
- [Changelog](CHANGELOG.md)

## Version 1 Acceptance Criteria

See individual checklists in documentation files. All criteria must pass before VERSION 1 release.

## License

Proprietary - All rights reserved
