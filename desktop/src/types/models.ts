export type Role = 'ADMIN' | 'SELLER' | 'ACCOUNTANT' | 'WAREHOUSE' | 'SHIPPER';

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile: string | null;
  is_active: boolean;
  roles: Role[];
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    roles: Role[];
  };
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface Page<T> {
  data: T[];
  pagination: Pagination;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  minio_key: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

/** unit_price arrives as a string because Pydantic serialises Decimal that way. */
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  unit_price: string;
  unit: string;
  minimum_order_quantity: number;
  stock_quantity: number;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
  is_available: boolean;
}

export interface ProductPayload {
  sku: string;
  name: string;
  description?: string | null;
  category_id?: string | null;
  unit_price: string | number;
  unit: string;
  minimum_order_quantity: number;
  stock_quantity: number;
  status: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  province: string;
  city: string;
  postal_code: string | null;
  street_address: string;
  is_default: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  mobile: string;
  company_name: string | null;
  national_id: string | null;
  economic_id: string | null;
  notes: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  addresses: CustomerAddress[];
}

export interface CustomerPayload {
  first_name: string;
  last_name: string;
  mobile: string;
  company_name?: string | null;
  national_id?: string | null;
  economic_id?: string | null;
  notes?: string | null;
}

export type ProductSort = 'created_at' | 'name' | 'sku' | 'unit_price' | 'stock_quantity';
export type SortOrder = 'asc' | 'desc';

export interface ProductQuery {
  page?: number;
  per_page?: number;
  search?: string;
  category_id?: string;
  status?: string;
  in_stock?: boolean;
  sort?: ProductSort;
  order?: SortOrder;
}

export interface CustomerQuery {
  page?: number;
  per_page?: number;
  search?: string;
  owner_id?: string;
}
