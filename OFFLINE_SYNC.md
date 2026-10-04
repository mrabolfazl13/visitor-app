# Offline & Sync Architecture

## Overview

The platform supports offline-first operation on both mobile (Flutter) and desktop (Tauri) clients. Users can perform critical operations without internet connectivity, with automatic synchronization when connection is restored.

## Supported Offline Operations

### Read Operations
- View products (with local cache)
- View customers
- View order history
- View dashboard data (cached)

### Write Operations
- Create customer
- Create draft order
- Submit order (queued for sync)
- Update customer (owned by seller)

### Not Available Offline
- Product creation/editing (Admin only)
- Order approval (Admin only)
- Accounting operations
- Inventory adjustments
- Shipment creation

## Local Database Schema

Both mobile (Drift) and desktop (SQLite via Tauri) maintain a subset of the server schema:

### Local Tables

#### products_cache
```sql
CREATE TABLE products_cache (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category_id TEXT,
  unit_price REAL NOT NULL,
  unit TEXT DEFAULT 'piece',
  minimum_order_quantity INTEGER DEFAULT 1,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'active',
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_products_name ON products_cache(name);
CREATE INDEX idx_products_sku ON products_cache(sku);
```

#### customers_local
```sql
CREATE TABLE customers_local (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  company_name TEXT,
  national_id TEXT,
  economic_id TEXT,
  owner_id TEXT NOT NULL,
  notes TEXT,
  is_synced BOOLEAN DEFAULT FALSE,
  server_id TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_customers_mobile ON customers_local(mobile);
CREATE INDEX idx_customers_owner ON customers_local(owner_id);
```

#### customer_addresses_local
```sql
CREATE TABLE customer_addresses_local (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers_local(id),
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  street_address TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (customer_id) REFERENCES customers_local(id) ON DELETE CASCADE
);
```

#### orders_local
```sql
CREATE TABLE orders_local (
  id TEXT PRIMARY KEY,
  local_id TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  total_amount REAL,
  rejection_reason TEXT,
  is_synced BOOLEAN DEFAULT FALSE,
  server_id TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_orders_customer ON orders_local(customer_id);
CREATE INDEX idx_orders_status ON orders_local(status);
```

#### order_items_local
```sql
CREATE TABLE order_items_local (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders_local(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders_local(id) ON DELETE CASCADE
);
```

#### sync_operations
```sql
CREATE TABLE sync_operations (
  id TEXT PRIMARY KEY,
  operation_type TEXT NOT NULL CHECK(operation_type IN ('CREATE', 'UPDATE', 'DELETE')),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'SYNCING', 'SUCCESS', 'FAILED', 'CONFLICT')),
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  synced_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_status ON sync_operations(status);
CREATE INDEX idx_sync_idempotency ON sync_operations(idempotency_key);
CREATE INDEX idx_sync_entity ON sync_operations(entity_type, entity_id);
```

#### sync_metadata
```sql
CREATE TABLE sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Store last sync timestamp for each entity type
INSERT INTO sync_metadata (key, value) VALUES ('last_products_sync', '0');
INSERT INTO sync_metadata (key, value) VALUES ('last_customers_sync', '0');
```

## Sync Flow

### 1. Offline Operation

```
User creates customer offline
       ↓
Save to customers_local with is_synced = FALSE
       ↓
Create sync_operation record:
  - operation_type: CREATE
  - entity_type: customer
  - entity_id: local_id
  - payload: JSON of customer data
  - idempotency_key: UUID v4
  - status: PENDING
```

### 2. Connectivity Detection

```
Network state changes to online
       ↓
Trigger sync engine
       ↓
Check for pending operations in sync_operations
       ↓
If pending operations exist, start sync process
```

### 3. Sync Process

```
Fetch pending operations (ORDER BY created_at ASC LIMIT 10)
       ↓
For each operation:
  1. Update status to SYNCING
  2. Send to backend with idempotency_key header
  3. Wait for response
  4. Handle response:
     - SUCCESS: Update status, set server_id if CREATE
     - FAILED: Increment retry_count, update last_error
     - CONFLICT: Update status to CONFLICT, notify user
  5. If FAILED and retry_count < 5: Schedule retry
  6. If FAILED and retry_count >= 5: Mark as FAILED, notify user
```

### 4. Retry Mechanism

Exponential backoff schedule:
- Attempt 1: Immediate
- Attempt 2: After 2 seconds
- Attempt 3: After 5 seconds
- Attempt 4: After 15 seconds
- Attempt 5: After 30 seconds
- Attempt 6: After 60 seconds (final attempt)

After 6 failed attempts:
- Mark operation as FAILED
- Show notification to user
- User can manually retry

### 5. Conflict Resolution

Conflicts occur when:
- Inventory insufficient for order items
- Customer already exists with same mobile
- Order references deleted product

Conflict handling:
```
Backend detects conflict during sync
       ↓
Returns CONFLICT status with details
       ↓
Client updates sync_operation status to CONFLICT
       ↓
Show user-friendly error message:
  "این سفارش قابل ثبت نیست. موجودی محصول «X» از ۱۰ به ۳ کاهش یافته است."
       ↓
User options:
  - Cancel operation (delete from local)
  - Modify and retry (update payload, reset status to PENDING)
```

## Idempotency

All mutation requests include `X-Idempotency-Key` header:

```
POST /api/v1/customers
X-Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{ ... customer data ... }
```

Backend behavior:
1. Check if idempotency_key exists in processed requests (Redis cache, 24h TTL)
2. If exists: Return cached response without re-processing
3. If not exists: Process request, cache response, return to client

This ensures:
- Network retries don't create duplicates
- Sync queue can safely retry failed operations
- Race conditions are handled gracefully

## Optimistic UI

UI updates immediately on local operation:

```
User adds item to cart
       ↓
Update local order_items_local
       ↓
Recalculate total locally
       ↓
UI shows updated cart immediately
       ↓
Sync operation queued in background
```

Benefits:
- Instant feedback to user
- No waiting for network
- Works seamlessly offline

Risks:
- Sync may fail later
- UI may show stale data

Mitigation:
- Show sync status indicator
- Notify user on sync failure
- Allow manual refresh

## Sync Status Indicators

UI displays current sync state:

| Indicator | Meaning | Color |
|-----------|---------|-------|
| ● Online | Connected, all synced | Green |
| ○ Offline | No connection, working locally | Gray |
| ↻ Syncing | Sync in progress | Blue |
| ✓ Synced | All operations synced | Green |
| ⚠ Sync Error | Failed operations pending | Red |
| 🔢 Pending: N | N operations waiting to sync | Orange |

Implementation:
- Listen to network state changes
- Monitor sync_operations table
- Update indicator in app header/status bar

## Data Freshness Strategy

### Products
- Cache on first load
- Refresh every 24 hours or on manual pull-to-refresh
- Invalidate cache on product-related sync operations

### Customers
- Sync owned customers on login
- Incremental sync based on last_synced_at
- Real-time updates via sync after local changes

### Orders
- Sync user's orders on login
- Incremental sync for status changes
- Full sync on manual refresh

### Dashboard Data
- Cache with 1-hour TTL
- Refresh on manual pull-to-refresh
- Stale-while-revalidate strategy

## Conflict Prevention

### Inventory Reservation
When order is created (even offline):
1. Reserve inventory locally (decrease available_quantity in local cache)
2. On sync, backend validates actual availability
3. If insufficient, conflict is raised

### Unique Constraints
- Mobile generates UUIDs locally for new entities
- Prevents ID collisions during sync
- Backend assigns final server_id on successful sync

### Version Tracking
- Each entity has updated_at timestamp
- Sync uses timestamps for incremental updates
- Last-write-wins for non-critical fields (notes, etc.)

## Testing Scenarios

### Scenario 1: Basic Offline Flow
```
1. Go offline
2. Create customer
3. Create order for customer
4. Go online
5. Verify sync completes successfully
6. Verify customer and order exist on server
```

### Scenario 2: Inventory Conflict
```
1. Product has stock = 5
2. Go offline
3. Create order with quantity = 4
4. Another user buys 3 units (stock now 2)
5. Go online, sync order
6. Verify conflict is detected
7. Verify user sees appropriate error message
```

### Scenario 3: Duplicate Prevention
```
1. Go offline
2. Create customer
3. Sync fails (simulated network error)
4. Retry automatically
5. Verify only one customer created on server
6. Verify idempotency_key prevented duplicate
```

### Scenario 4: Concurrent Operations
```
1. Create 10 customers offline
2. Create 5 orders offline
3. Go online
4. Verify all operations sync in correct order
5. Verify no data loss or corruption
```

## Performance Considerations

### Batch Sync
- Send up to 10 operations per batch
- Reduces HTTP overhead
- Allows partial success/failure handling

### Compression
- Compress large payloads before storing in sync_operations
- Reduces local storage usage
- Backend decompresses on receipt

### Cleanup
- Delete successful sync_operations older than 7 days
- Archive failed operations for debugging
- Periodic cleanup via Celery scheduled task

### Storage Limits
- Maximum 1000 pending sync operations
- Oldest operations archived if limit exceeded
- User notified if approaching limit

## Monitoring & Debugging

### Sync Metrics
Track and report:
- Total pending operations
- Average sync time
- Success rate
- Conflict rate
- Retry count distribution

### Debug Mode
Enable detailed logging:
- Log all sync operations
- Include request/response bodies
- Track timing for each operation
- Export logs for support tickets

### Manual Sync Trigger
Provide UI button to:
- Force sync all pending operations
- Retry failed operations
- Clear sync queue (with confirmation)
