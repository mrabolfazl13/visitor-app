# Architecture Documentation

## System Overview

B2B Sales, Customer, Inventory & Order Management Platform is a multi-platform application serving Android, iOS, and Windows Desktop clients with a centralized FastAPI backend.

### Key Architectural Decisions

1. **Centralized Business Logic**: All business rules reside in the FastAPI backend to ensure consistency across platforms
2. **Offline-First Design**: Mobile and desktop apps maintain local databases for offline operation with automatic sync
3. **Transaction Safety**: Inventory operations use database transactions with row-level locking to prevent overselling
4. **Price Snapshotting**: Order items store the unit_price at order creation time to preserve historical accuracy
5. **Idempotency**: All sensitive mutations include idempotency keys to prevent duplicate operations during retry

## Technology Stack Justification

### Mobile: Flutter
- Single codebase for Android and iOS
- Excellent performance with native compilation
- Rich ecosystem for offline storage (Drift)
- Strong typing with Dart

### Desktop: Tauri + React
- Native Windows experience with web technologies
- Smaller bundle size compared to Electron
- Access to native capabilities via Rust commands
- Modern React ecosystem with TypeScript

### Backend: FastAPI
- High performance with async support
- Automatic OpenAPI documentation
- Type safety with Pydantic
- Easy integration with SQLAlchemy 2

### Database: PostgreSQL
- ACID compliance for transaction safety
- Row-level locking for inventory protection
- JSONB support for flexible metadata
- Mature ecosystem with excellent tooling

### Cache/Queue: Redis
- Fast in-memory operations for caching
- Reliable message broker for Celery
- Support for distributed locks if needed

### Object Storage: MinIO
- S3-compatible API
- Self-hosted for data sovereignty
- Efficient handling of product images
- Built-in lifecycle policies

## Deployment Architecture

```
                    ┌─────────────────────────────────┐
                    │     Docker Compose Network      │
                    │                                 │
    Client Apps     │  ┌──────────┐  ┌────────────┐  │
   ┌──────────┐     │  │PostgreSQL│  │   Redis    │  │
   │ Android  │◄────┼──│          │  │            │  │
   └──────────┘     │  └────┬─────┘  └─────┬──────┘  │
                    │       │               │         │
   ┌──────────┐     │  ┌────▼──────────────▼─────┐    │
   │   iOS    │◄────┼──│    FastAPI Backend      │    │
   └──────────┘     │  │                         │    │
                    │  │  - Authentication       │    │
   ┌──────────┐     │  │  - Products             │    │
   │ Windows  │◄────┼──│  - Customers            │    │
   └──────────┘     │  │  - Orders               │    │
                    │  │  - Inventory            │    │
                    │  │  - Accounting           │    │
                    │  │  - Reports              │    │
                    │  └───────────┬─────────────┘    │
                    │              │                  │
                    │         ┌────▼────┐             │
                    │         │  MinIO  │             │
                    │         │         │             │
                    │         └─────────┘             │
                    └─────────────────────────────────┘

Background Jobs:
   ┌──────────────────┐    ┌──────────────────┐
   │  Celery Worker   │    │   Celery Beat    │
   │                  │    │                  │
   │ - Image Process  │    │ - Periodic Sync  │
   │ - Notifications  │    │ - Cleanup Jobs   │
   │ - Reports        │    │ - Scheduled Tasks│
   └──────────────────┘    └──────────────────┘
```

## Domain Architecture

### Core Domains

1. **Identity & Access Management**
   - Users, Roles, Permissions
   - Authentication (JWT)
   - Authorization (RBAC)

2. **Product Management**
   - Products, Categories, Images
   - Pricing, Stock levels
   - SKU management

3. **Customer Management**
   - Customer profiles
   - Addresses
   - Ownership (seller-specific or shared)

4. **Order Management**
   - Orders, Order Items
   - State machine workflow
   - Cart operations

5. **Accounting**
   - Invoices, Invoice Items
   - Payments, Payment Status
   - Tax, Discounts, Debt tracking

6. **Inventory Management**
   - Stock levels
   - Inventory movements
   - Reservations, Releases

7. **Warehouse Operations**
   - Picking lists
   - Preparation status
   - Inventory validation

8. **Shipping**
   - Shipments
   - Tracking numbers
   - Delivery status

9. **Reporting & Analytics**
   - Sales reports
   - Product analytics
   - Seller performance
   - Inventory reports

10. **Audit & Compliance**
    - Audit logs
    - Change tracking
    - Historical records

## Offline/Sync Architecture

### Local Database Strategy

- **Mobile**: Drift (SQLite wrapper for Flutter)
- **Desktop**: SQLite via Tauri commands
- **Schema**: Subset of server schema for offline entities

### Sync Mechanism

1. **Sync Queue**: Local table storing pending operations
2. **Operation Types**: CREATE, UPDATE, DELETE
3. **Idempotency**: UUID-based keys prevent duplicates
4. **Retry**: Exponential backoff (2s, 5s, 15s, 30s, 60s)
5. **Conflict Detection**: Server-side validation on sync
6. **Conflict Resolution**: User notification with current state

### Sync Flow

```
Offline Operation
       ↓
Local DB Update
       ↓
Create Sync Operation (PENDING)
       ↓
Connectivity Detected
       ↓
Process Queue (FIFO)
       ↓
Send to Backend with Idempotency Key
       ↓
Backend Validates & Processes
       ↓
Update Sync Status (SUCCESS/FAILED/CONFLICT)
       ↓
If FAILED: Retry with Backoff
If CONFLICT: Notify User
```

## Security Architecture

### Authentication
- JWT access tokens (30 min expiry)
- Refresh tokens (7 day expiry)
- Secure token storage on clients
- Token refresh on expiration

### Authorization
- Role-based access control (RBAC)
- Permission checks at API level
- Seller data isolation (ownership model)
- Admin override capabilities

### Data Protection
- Password hashing with bcrypt
- HTTPS for all API communication
- No secrets in client bundles
- MinIO signed URLs for image access

### API Security
- Rate limiting on authentication endpoints
- CORS configuration for known origins
- Input validation with Pydantic
- SQL injection prevention via ORM

## Performance Targets

| Metric | Target |
|--------|--------|
| Local Search | < 100ms |
| Cart Interaction | < 100ms |
| Product First Render | < 1.5s |
| API p95 (simple) | < 500ms |
| Scale | 10,000 products, 10,000 customers |

## Scalability Considerations

1. **Database**: Connection pooling, proper indexing, query optimization
2. **Caching**: Redis for frequently accessed data (product lists, user sessions)
3. **Background Jobs**: Celery for image processing, notifications, reports
4. **Static Assets**: MinIO with CDN capability for product images
5. **Horizontal Scaling**: Stateless backend allows multiple instances behind load balancer

## Monitoring & Observability

- Flower dashboard for Celery task monitoring
- Structured logging in backend
- Audit logs for business-critical operations
- Health checks for all Docker services
- Error tracking and alerting (to be configured)
