# Database Schema

## Entity Relationship Overview

```
users ──┬── user_roles ── roles ── role_permissions ── permissions
        │
        ├── products (created_by)
        ├── customers (created_by)
        ├── orders (created_by, seller_id)
        ├── order_items
        ├── invoices (created_by)
        ├── payments (created_by)
        ├── inventory_movements (created_by)
        ├── shipments (created_by)
        └── audit_logs (user_id)

products ──┬── product_images
           ├── categories
           ├── order_items
           └── inventory

customers ──┬── customer_addresses
            ├── orders
            └── invoices

orders ──┬── order_items
         ├── invoices
         └── shipments

inventory ── inventory_movements
```

## Tables

### users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | User identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| mobile | VARCHAR(20) | | Phone number |
| is_active | BOOLEAN | DEFAULT TRUE | Account status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

**Indexes**: email (unique), mobile

### roles

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Role identifier |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Role name (ADMIN, SELLER, ACCOUNTANT, WAREHOUSE, SHIPPER) |
| description | TEXT | | Role description |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

### permissions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Permission identifier |
| code | VARCHAR(100) | UNIQUE, NOT NULL | Permission code (e.g., products:create) |
| name | VARCHAR(100) | NOT NULL | Human-readable name |
| description | TEXT | | Permission description |

### user_roles

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | FK(users.id), PK | User reference |
| role_id | UUID | FK(roles.id), PK | Role reference |
| assigned_at | TIMESTAMP | DEFAULT NOW() | Assignment time |

### role_permissions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| role_id | UUID | FK(roles.id), PK | Role reference |
| permission_id | UUID | FK(permissions.id), PK | Permission reference |

### categories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Category identifier |
| name | VARCHAR(100) | NOT NULL | Category name |
| parent_id | UUID | FK(categories.id) | Parent category for hierarchy |
| description | TEXT | | Category description |
| is_active | BOOLEAN | DEFAULT TRUE | Category status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

**Indexes**: parent_id

### products

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Product identifier |
| sku | VARCHAR(50) | UNIQUE, NOT NULL | Stock keeping unit |
| name | VARCHAR(255) | NOT NULL | Product name |
| description | TEXT | | Product description |
| category_id | UUID | FK(categories.id) | Product category |
| unit_price | DECIMAL(12, 2) | NOT NULL | Current price |
| unit | VARCHAR(20) | DEFAULT 'piece' | Unit of measurement |
| minimum_order_quantity | INTEGER | DEFAULT 1 | Minimum order quantity |
| stock_quantity | INTEGER | NOT NULL, DEFAULT 0 | Current stock |
| status | VARCHAR(20) | DEFAULT 'active' | active, inactive, discontinued |
| created_by | UUID | FK(users.id) | Creator (Admin) |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

**Indexes**: sku (unique), category_id, name (gin trigram for search), status, created_by

### product_images

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Image identifier |
| product_id | UUID | FK(products.id), NOT NULL | Product reference |
| minio_key | VARCHAR(500) | NOT NULL | MinIO object key |
| file_name | VARCHAR(255) | NOT NULL | Original filename |
| mime_type | VARCHAR(100) | | MIME type |
| file_size | INTEGER | | File size in bytes |
| width | INTEGER | | Image width |
| height | INTEGER | | Image height |
| is_primary | BOOLEAN | DEFAULT FALSE | Primary image flag |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| created_at | TIMESTAMP | DEFAULT NOW() | Upload time |

**Indexes**: product_id, is_primary

### customers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Customer identifier |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| mobile | VARCHAR(20) | NOT NULL | Mobile number |
| company_name | VARCHAR(255) | | Company name |
| national_id | VARCHAR(20) | | National ID |
| economic_id | VARCHAR(20) | | Economic ID |
| owner_id | UUID | FK(users.id) | Owning seller |
| notes | TEXT | | Additional notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

**Indexes**: mobile, owner_id, company_name, name trigram for search

### customer_addresses

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Address identifier |
| customer_id | UUID | FK(customers.id), NOT NULL | Customer reference |
| province | VARCHAR(100) | NOT NULL | Province |
| city | VARCHAR(100) | NOT NULL | City |
| postal_code | VARCHAR(20) | | Postal code |
| street_address | TEXT | NOT NULL | Street address |
| is_default | BOOLEAN | DEFAULT FALSE | Default address flag |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes**: customer_id

### orders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Order identifier |
| order_number | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable order number |
| customer_id | UUID | FK(customers.id), NOT NULL | Customer reference |
| seller_id | UUID | FK(users.id), NOT NULL | Seller who created order |
| status | VARCHAR(30) | NOT NULL | State machine status |
| total_amount | DECIMAL(14, 2) | | Order total |
| rejection_reason | TEXT | | Reason if rejected |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |
| approved_at | TIMESTAMP | | Approval timestamp |
| approved_by | UUID | FK(users.id) | Approver (Admin) |

**State Machine**: DRAFT → PENDING_APPROVAL → APPROVED → ACCOUNTING → WAREHOUSE → READY_TO_SHIP → SHIPPED → DELIVERED
**Additional States**: REJECTED, CANCELLED

**Indexes**: order_number (unique), customer_id, seller_id, status, created_at

### order_items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Item identifier |
| order_id | UUID | FK(orders.id), NOT NULL | Order reference |
| product_id | UUID | FK(products.id), NOT NULL | Product reference |
| quantity | INTEGER | NOT NULL | Ordered quantity |
| unit_price | DECIMAL(12, 2) | NOT NULL | Price at order time (snapshot) |
| subtotal | DECIMAL(14, 2) | NOT NULL | quantity * unit_price |

**Indexes**: order_id, product_id

### invoices

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Invoice identifier |
| invoice_number | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable invoice number |
| order_id | UUID | FK(orders.id), NOT NULL | Related order |
| customer_id | UUID | FK(customers.id), NOT NULL | Customer reference |
| seller_id | UUID | FK(users.id), NOT NULL | Seller reference |
| subtotal | DECIMAL(14, 2) | NOT NULL | Before tax and discount |
| discount_amount | DECIMAL(14, 2) | DEFAULT 0 | Discount applied |
| tax_amount | DECIMAL(14, 2) | DEFAULT 0 | Tax applied |
| total_amount | DECIMAL(14, 2) | NOT NULL | Final amount |
| payment_status | VARCHAR(20) | DEFAULT 'UNPAID' | UNPAID, PARTIALLY_PAID, PAID |
| created_by | UUID | FK(users.id) | Creator (Accountant) |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| due_date | DATE | | Payment due date |

**Indexes**: invoice_number (unique), order_id, customer_id, seller_id, payment_status

### invoice_items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Item identifier |
| invoice_id | UUID | FK(invoices.id), NOT NULL | Invoice reference |
| product_id | UUID | FK(products.id), NOT NULL | Product reference |
| quantity | INTEGER | NOT NULL | Quantity |
| unit_price | DECIMAL(12, 2) | NOT NULL | Unit price |
| subtotal | DECIMAL(14, 2) | NOT NULL | quantity * unit_price |

**Indexes**: invoice_id, product_id

### payments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Payment identifier |
| invoice_id | UUID | FK(invoices.id), NOT NULL | Invoice reference |
| amount | DECIMAL(14, 2) | NOT NULL | Payment amount |
| payment_method | VARCHAR(50) | | cash, bank_transfer, check, etc. |
| payment_date | DATE | NOT NULL | Date of payment |
| reference_number | VARCHAR(100) | | Bank reference, check number, etc. |
| notes | TEXT | | Additional notes |
| created_by | UUID | FK(users.id) | Creator (Accountant) |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes**: invoice_id, payment_date

### inventory

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Inventory record identifier |
| product_id | UUID | FK(products.id), UNIQUE, NOT NULL | Product reference |
| quantity | INTEGER | NOT NULL, DEFAULT 0 | Current stock |
| reserved_quantity | INTEGER | NOT NULL, DEFAULT 0 | Reserved for pending orders |
| available_quantity | GENERATED ALWAYS AS (quantity - reserved_quantity) | | Calculated available stock |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Note**: `available_quantity` is a generated column in PostgreSQL 12+

**Indexes**: product_id (unique)

### inventory_movements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Movement identifier |
| product_id | UUID | FK(products.id), NOT NULL | Product reference |
| movement_type | VARCHAR(20) | NOT NULL | PURCHASE, SALE, ADJUSTMENT, RETURN, RESERVATION, RELEASE |
| quantity | INTEGER | NOT NULL | Positive for inbound, negative for outbound |
| reference_type | VARCHAR(50) | | order, adjustment, return, etc. |
| reference_id | UUID | | Reference entity ID |
| previous_quantity | INTEGER | NOT NULL | Stock before movement |
| new_quantity | INTEGER | NOT NULL | Stock after movement |
| created_by | UUID | FK(users.id) | Creator |
| created_at | TIMESTAMP | DEFAULT NOW() | Movement time |
| notes | TEXT | | Additional notes |

**Indexes**: product_id, movement_type, reference_type, reference_id, created_at

### shipments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Shipment identifier |
| order_id | UUID | FK(orders.id), NOT NULL | Order reference |
| tracking_number | VARCHAR(100) | UNIQUE | Tracking number |
| carrier | VARCHAR(100) | | Shipping carrier |
| shipping_address_id | UUID | FK(customer_addresses.id) | Delivery address |
| status | VARCHAR(30) | DEFAULT 'PENDING' | PENDING, IN_TRANSIT, DELIVERED, FAILED, RETURNED |
| shipped_at | TIMESTAMP | | Shipment time |
| delivered_at | TIMESTAMP | | Delivery time |
| created_by | UUID | FK(users.id) | Creator (Shipper) |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes**: order_id, tracking_number (unique), status

### audit_logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Log identifier |
| user_id | UUID | FK(users.id) | User who performed action |
| action | VARCHAR(100) | NOT NULL | Action performed |
| entity_type | VARCHAR(50) | NOT NULL | Type of entity affected |
| entity_id | UUID | | Entity ID affected |
| old_value | JSONB | | Previous state |
| new_value | JSONB | | New state |
| ip_address | VARCHAR(45) | | Client IP |
| user_agent | TEXT | | Client user agent |
| created_at | TIMESTAMP | DEFAULT NOW() | Action time |

**Indexes**: user_id, entity_type, entity_id, created_at, action

### sync_operations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Sync operation identifier |
| operation_type | VARCHAR(20) | NOT NULL | CREATE, UPDATE, DELETE |
| entity_type | VARCHAR(50) | NOT NULL | Type of entity |
| entity_id | UUID | | Entity ID |
| payload | JSONB | NOT NULL | Operation data |
| idempotency_key | VARCHAR(255) | UNIQUE, NOT NULL | Idempotency key |
| status | VARCHAR(20) | DEFAULT 'PENDING' | PENDING, SYNCING, SUCCESS, FAILED, CONFLICT |
| retry_count | INTEGER | DEFAULT 0 | Number of retries |
| last_error | TEXT | | Last error message |
| synced_at | TIMESTAMP | | Successful sync time |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes**: status, idempotency_key (unique), entity_type, entity_id, created_at

## Database Constraints & Rules

### Inventory Safety
- All inventory modifications must go through `inventory_movements` table
- Use transaction with `SELECT FOR UPDATE` on inventory row before modification
- Check `available_quantity >= requested_quantity` before allowing sale
- Reservation reduces `reserved_quantity`, release increases it

### Price Snapshot
- `order_items.unit_price` captures price at order creation time
- Changes to `products.unit_price` do not affect existing orders

### Soft Delete
- Entities with `deleted_at` should use query filters: `WHERE deleted_at IS NULL`
- SQLAlchemy event listeners can automate this

### Idempotency
- All mutation endpoints accept `X-Idempotency-Key` header
- Backend checks for existing operation with same key before processing
- Prevents duplicate operations during network retries

### Audit Trail
- Critical operations log to `audit_logs` with old/new values
- Includes user context, IP address, timestamp
- Cannot be deleted or modified (append-only)

## Indexes Strategy

### Performance Indexes
- Foreign keys: Always indexed for JOIN performance
- Search fields: GIN trigram indexes for text search (name, company_name)
- Status fields: Indexed for filtering (order status, payment status)
- Timestamps: Indexed for sorting and date range queries

### Composite Indexes
- `(seller_id, created_at)` on orders for seller dashboard
- `(customer_id, created_at)` on orders for customer history
- `(product_id, created_at)` on inventory_movements for product analytics

## Migrations

Managed via Alembic:
- Version-controlled migration scripts
- Automatic upgrade/downgrade capability
- Seed data for development environment
- Migration testing in CI/CD pipeline
