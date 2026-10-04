from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class OrderItemBase(BaseModel):
    product_id: UUID
    quantity: int = Field(..., gt=0)


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(BaseModel):
    id: UUID
    order_id: UUID
    product_id: UUID
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    customer_id: UUID


class OrderCreate(BaseModel):
    customer_id: UUID
    items: list[OrderItemCreate]


class OrderUpdate(BaseModel):
    # Only for DRAFT status
    customer_id: Optional[UUID] = None
    items: Optional[list[OrderItemCreate]] = None


class OrderResponse(BaseModel):
    id: UUID
    order_number: str
    customer_id: UUID
    seller_id: UUID
    status: str
    total_amount: Optional[Decimal] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    approved_at: Optional[datetime] = None
    items: list[OrderItemResponse] = []

    class Config:
        from_attributes = True


class OrderApprovalRequest(BaseModel):
    approved: bool
    rejection_reason: Optional[str] = None

    class Config:
        # Ensure rejection_reason is provided when rejected
        pass
