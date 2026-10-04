from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[UUID] = None
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[UUID] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProductImageBase(BaseModel):
    file_name: str
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    is_primary: bool = False
    sort_order: int = 0


class ProductImageResponse(ProductImageBase):
    id: UUID
    product_id: UUID
    minio_key: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    sku: str
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    unit_price: Decimal = Field(..., gt=0)
    unit: str = "piece"
    minimum_order_quantity: int = Field(default=1, ge=1)
    stock_quantity: int = Field(default=0, ge=0)
    status: str = "active"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    unit_price: Optional[Decimal] = None
    unit: Optional[str] = None
    minimum_order_quantity: Optional[int] = None
    stock_quantity: Optional[int] = None
    status: Optional[str] = None


class ProductResponse(ProductBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    images: list[ProductImageResponse] = []
    is_available: bool

    class Config:
        from_attributes = True
