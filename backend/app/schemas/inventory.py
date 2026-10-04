from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class InventoryResponse(BaseModel):
    id: UUID
    product_id: UUID
    quantity: int
    reserved_quantity: int
    available_quantity: int
    updated_at: datetime

    class Config:
        from_attributes = True


class InventoryAdjustment(BaseModel):
    product_id: UUID
    movement_type: str  # PURCHASE, ADJUSTMENT, RETURN
    quantity: int  # Positive for inbound, negative for outbound
    reference_type: Optional[str] = None
    notes: Optional[str] = None


class InventoryMovementResponse(BaseModel):
    id: UUID
    product_id: UUID
    movement_type: str
    quantity: int
    reference_type: Optional[str] = None
    reference_id: Optional[UUID] = None
    previous_quantity: int
    new_quantity: int
    created_at: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True
