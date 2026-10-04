from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class ShipmentCreate(BaseModel):
    order_id: UUID
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    shipping_address_id: Optional[UUID] = None


class ShipmentUpdate(BaseModel):
    status: Optional[str] = None
    tracking_number: Optional[str] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None


class ShipmentResponse(BaseModel):
    id: UUID
    order_id: UUID
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    shipping_address_id: Optional[UUID] = None
    status: str
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
