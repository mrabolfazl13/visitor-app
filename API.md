# API Documentation

## Base URL

```
/api/v1/
```

## Authentication

All endpoints except `/auth/login` and `/auth/register` require JWT authentication.

### Headers

```
Authorization: Bearer <access_token>
X-Idempotency-Key: <uuid>  # For mutation operations
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

## Query Parameters

All collection endpoints support:

- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)
- `sort`: Sort field (e.g., `created_at`, `name`, `price`)
- `order`: Sort direction (`asc` or `desc`, default: `desc`)
- `search`: Search query (text search)
- `filter[field]`: Field-specific filters

---

## Authentication Endpoints

### POST /auth/login

Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 1800,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "roles": ["SELLER"]
    }
  }
}
```

### POST /auth/refresh

Refresh access token.

**Request:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "expires_in": 1800
  }
}
```

### POST /auth/logout

Logout and invalidate tokens.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /auth/change-password

Change user password.

**Request:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword"
}
```

---

## User Management Endpoints

### GET /users/me

Get current user profile.

**Response:** User object with roles and permissions

### PUT /users/me

Update current user profile.

**Request:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "mobile": "+1234567890"
}
```

### GET /users

List all users (Admin only).

**Query Parameters:**
- `search`: Search by name or email
- `filter[role]`: Filter by role
- `filter[is_active]`: Filter by active status

**Response:** Paginated user list

### POST /users

Create new user (Admin only).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe",
  "mobile": "+1234567890",
  "role_ids": ["uuid1", "uuid2"]
}
```

### GET /users/{id}

Get user by ID (Admin only).

### PUT /users/{id}

Update user (Admin only).

### DELETE /users/{id}

Soft delete user (Admin only).

---

## Role & Permission Endpoints

### GET /roles

List all roles (Admin only).

### POST /roles

Create new role (Admin only).

**Request:**
```json
{
  "name": "CUSTOM_ROLE",
  "description": "Custom role description",
  "permission_ids": ["uuid1", "uuid2"]
}
```

### GET /permissions

List all permissions (Admin only).

---

## Product Endpoints

### GET /products

List products.

**Access:** All authenticated users

**Query Parameters:**
- `search`: Search by name or SKU
- `filter[category_id]`: Filter by category
- `filter[status]`: Filter by status (active, inactive, discontinued)
- `filter[in_stock]`: Filter in-stock products only
- `sort`: Sort by name, price, stock_quantity, created_at
- `order`: asc or desc

**Response:** Paginated product list with images

### GET /products/{id}

Get product by ID.

**Response:** Product object with images and category

### POST /products

Create product (Admin only).

**Request:**
```json
{
  "sku": "PROD-001",
  "name": "Product Name",
  "description": "Product description",
  "category_id": "uuid",
  "unit_price": 99.99,
  "unit": "piece",
  "minimum_order_quantity": 1,
  "stock_quantity": 100,
  "status": "active"
}
```

### PUT /products/{id}

Update product (Admin only).

### DELETE /products/{id}

Soft delete product (Admin only).

### POST /products/{id}/images

Upload product image (Admin only).

**Request:** Multipart form data with image file

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "minio_key": "bucket/path/to/image.jpg",
    "file_name": "image.jpg",
    "mime_type": "image/jpeg",
    "file_size": 102400,
    "width": 800,
    "height": 600,
    "is_primary": false
  }
}
```

### PUT /products/{id}/images/{image_id}

Set primary image or update image metadata (Admin only).

### DELETE /products/{id}/images/{image_id}

Delete product image (Admin only).

---

## Category Endpoints

### GET /categories

List categories.

**Response:** Hierarchical category list

### POST /categories

Create category (Admin only).

**Request:**
```json
{
  "name": "Category Name",
  "parent_id": "uuid",
  "description": "Category description"
}
```

### PUT /categories/{id}

Update category (Admin only).

### DELETE /categories/{id}

Soft delete category (Admin only).

---

## Customer Endpoints

### GET /customers

List customers.

**Access:**
- Admin: All customers
- Seller: Only owned customers

**Query Parameters:**
- `search`: Search by name, mobile, or company
- `filter[owner_id]`: Filter by owner (Admin only)

**Response:** Paginated customer list with addresses

### GET /customers/{id}

Get customer by ID.

**Access Control:** Owner or Admin

### POST /customers

Create customer.

**Access:** Seller (creates with owner_id = current user), Admin (can specify owner_id)

**Request:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "mobile": "+1234567890",
  "company_name": "ABC Company",
  "national_id": "1234567890",
  "economic_id": "9876543210",
  "notes": "VIP customer",
  "addresses": [
    {
      "province": "Tehran",
      "city": "Tehran",
      "postal_code": "1234567890",
      "street_address": "123 Main St",
      "is_default": true
    }
  ]
}
```

### PUT /customers/{id}

Update customer.

**Access Control:** Owner, Admin

### DELETE /customers/{id}

Soft delete customer.

**Access Control:** Owner, Admin

---

## Order Endpoints

### GET /orders

List orders.

**Access:**
- Admin: All orders
- Seller: Orders created by seller
- Accountant/Warehouse/Shipper: Based on workflow stage

**Query Parameters:**
- `search`: Search by order_number or customer name
- `filter[status]`: Filter by status
- `filter[seller_id]`: Filter by seller (Admin only)
- `filter[customer_id]`: Filter by customer
- `sort`: Sort by order_number, total_amount, created_at
- `order`: asc or desc

**Response:** Paginated order list with items summary

### GET /orders/{id}

Get order by ID.

**Response:** Full order with items, customer, seller details

### POST /orders

Create order.

**Access:** Seller

**Request:**
```json
{
  "customer_id": "uuid",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 5
    }
  ]
}
```

**Business Rules:**
- Validates product availability
- Captures unit_price snapshot
- Calculates total_amount
- Creates inventory reservation
- Sets status to DRAFT

### PUT /orders/{id}

Update order (only if status is DRAFT).

### POST /orders/{id}/submit

Submit order for approval (DRAFT → PENDING_APPROVAL).

**Access:** Seller

### POST /orders/{id}/approve

Approve order (PENDING_APPROVAL → APPROVED).

**Access:** Admin

**Request:**
```json
{
  "approved": true
}
```

If rejected:
```json
{
  "approved": false,
  "rejection_reason": "Insufficient credit limit"
}
```

### POST /orders/{id}/cancel

Cancel order (any state before DELIVERED).

**Access:** Seller (if DRAFT or PENDING_APPROVAL), Admin (any state)

### POST /orders/{id}/advance

Advance order to next workflow stage.

**Access:** Based on target stage:
- APPROVED → ACCOUNTING: Accountant
- ACCOUNTING → WAREHOUSE: Accountant
- WAREHOUSE → READY_TO_SHIP: Warehouse
- READY_TO_SHIP → SHIPPED: Shipper

---

## Invoice Endpoints

### GET /invoices

List invoices.

**Access:** Admin, Accountant

**Query Parameters:**
- `filter[payment_status]`: UNPAID, PARTIALLY_PAID, PAID
- `filter[customer_id]`: Filter by customer
- `filter[seller_id]`: Filter by seller
- `filter[date_from]`: Start date
- `filter[date_to]`: End date

### GET /invoices/{id}

Get invoice by ID.

### POST /invoices

Create invoice from order.

**Access:** Accountant

**Request:**
```json
{
  "order_id": "uuid",
  "discount_amount": 50.00,
  "tax_rate": 9,
  "due_date": "2024-12-31"
}
```

**Business Rules:**
- Calculates subtotal from order items
- Applies discount and tax
- Sets payment_status to UNPAID

### PUT /invoices/{id}

Update invoice (Accountant only).

### POST /invoices/{id}/payments

Record payment.

**Access:** Accountant

**Request:**
```json
{
  "amount": 500.00,
  "payment_method": "bank_transfer",
  "payment_date": "2024-01-15",
  "reference_number": "REF123456",
  "notes": "Partial payment"
}
```

**Business Rules:**
- Updates invoice payment_status
- Creates payment record
- Validates amount does not exceed remaining balance

---

## Inventory Endpoints

### GET /inventory

List inventory levels.

**Access:** Admin, Warehouse

**Query Parameters:**
- `filter[low_stock]`: Products below minimum threshold
- `filter[out_of_stock]`: Out of stock products
- `sort`: Sort by quantity, available_quantity

### GET /inventory/{product_id}

Get inventory for specific product.

### POST /inventory/adjustments

Create inventory adjustment.

**Access:** Admin, Warehouse

**Request:**
```json
{
  "product_id": "uuid",
  "movement_type": "ADJUSTMENT",
  "quantity": -5,
  "reference_type": "physical_count",
  "notes": "Physical count adjustment"
}
```

**Business Rules:**
- Transaction-safe with row-level locking
- Creates inventory_movement record
- Updates inventory quantity

### GET /inventory/movements

List inventory movements.

**Query Parameters:**
- `filter[product_id]`: Filter by product
- `filter[movement_type]`: PURCHASE, SALE, ADJUSTMENT, RETURN, RESERVATION, RELEASE
- `filter[date_from]`: Start date
- `filter[date_to]`: End date

---

## Shipment Endpoints

### GET /shipments

List shipments.

**Access:** Admin, Shipper

**Query Parameters:**
- `filter[status]`: PENDING, IN_TRANSIT, DELIVERED, FAILED, RETURNED
- `filter[order_id]`: Filter by order

### GET /shipments/{id}

Get shipment by ID.

### POST /shipments

Create shipment.

**Access:** Shipper

**Request:**
```json
{
  "order_id": "uuid",
  "tracking_number": "TRACK123456",
  "carrier": "Post Company",
  "shipping_address_id": "uuid"
}
```

**Business Rules:**
- Validates order is in READY_TO_SHIP status
- Advances order to SHIPPED status

### PUT /shipments/{id}

Update shipment status.

**Request:**
```json
{
  "status": "DELIVERED"
}
```

**Business Rules:**
- If DELIVERED, advances order to DELIVERED status
- Records delivered_at timestamp

---

## Report Endpoints

### GET /reports/sales/summary

Get sales summary.

**Access:** Admin

**Query Parameters:**
- `filter[date_from]`: Start date
- `filter[date_to]`: End date
- `group_by`: day, week, month

**Response:**
```json
{
  "total_sales": 50000.00,
  "total_orders": 150,
  "average_order_value": 333.33,
  "periods": [
    {
      "date": "2024-01-01",
      "sales": 1500.00,
      "orders": 5
    }
  ]
}
```

### GET /reports/sales/by-seller

Get sales breakdown by seller.

### GET /reports/sales/by-product

Get sales breakdown by product.

### GET /reports/inventory/low-stock

Get low stock products.

### GET /reports/payments/summary

Get payment summary.

### GET /reports/sellers/{seller_id}/analytics

Get detailed analytics for specific seller.

**Response:**
```json
{
  "seller": { ... },
  "total_sales": 25000.00,
  "total_orders": 75,
  "items_sold": 300,
  "average_order_value": 333.33,
  "top_products": [ ... ],
  "top_customers": [ ... ]
}
```

### GET /reports/products/{product_id}/analytics

Get detailed analytics for specific product.

---

## Dashboard Endpoints

### GET /dashboard/seller

Get seller dashboard data.

**Access:** Seller

**Response:**
```json
{
  "today_sales": 1500.00,
  "monthly_sales": 15000.00,
  "pending_orders": 5,
  "total_customers": 50,
  "top_products": [ ... ],
  "recent_orders": [ ... ]
}
```

### GET /dashboard/admin

Get admin dashboard data.

**Access:** Admin

**Response:**
```json
{
  "total_sales": 100000.00,
  "total_orders": 300,
  "total_sellers": 10,
  "total_customers": 200,
  "total_products": 150,
  "low_stock_products": 10,
  "pending_orders": 15,
  "sales_chart": [ ... ],
  "sales_by_seller": [ ... ],
  "top_products": [ ... ]
}
```

---

## Sync Endpoints

### POST /sync/operations

Batch sync operations from client.

**Request:**
```json
{
  "operations": [
    {
      "operation_type": "CREATE",
      "entity_type": "customer",
      "entity_id": "local-uuid",
      "payload": { ... },
      "idempotency_key": "unique-key-1"
    },
    {
      "operation_type": "UPDATE",
      "entity_type": "order",
      "entity_id": "server-uuid",
      "payload": { ... },
      "idempotency_key": "unique-key-2"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "idempotency_key": "unique-key-1",
      "status": "SUCCESS",
      "server_id": "server-uuid"
    },
    {
      "idempotency_key": "unique-key-2",
      "status": "CONFLICT",
      "error": "Inventory insufficient for product X"
    }
  ]
}
```

---

## Audit Log Endpoints

### GET /audit-logs

List audit logs.

**Access:** Admin

**Query Parameters:**
- `filter[user_id]`: Filter by user
- `filter[entity_type]`: Filter by entity type
- `filter[entity_id]`: Filter by entity ID
- `filter[action]`: Filter by action
- `filter[date_from]`: Start date
- `filter[date_to]`: End date

---

## Error Codes

| Code | Description |
|------|-------------|
| VALIDATION_ERROR | Invalid input data |
| AUTHENTICATION_ERROR | Invalid or expired token |
| AUTHORIZATION_ERROR | Insufficient permissions |
| NOT_FOUND | Resource not found |
| CONFLICT | Resource conflict (e.g., overselling) |
| DUPLICATE_ENTRY | Unique constraint violation |
| INVENTORY_INSUFFICIENT | Not enough stock |
| INVALID_STATE_TRANSITION | Order state machine violation |
| RATE_LIMIT_EXCEEDED | Too many requests |
| INTERNAL_ERROR | Server error |

---

## Rate Limiting

- Authentication endpoints: 10 requests per minute
- General API: 100 requests per minute per user
- File uploads: 5 requests per minute

Rate limit headers included in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```
