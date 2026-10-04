from sqlalchemy import Column, Integer, String, Text, Integer, DateTime, ForeignKey, Enum as SQLEnum, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class MovementType:
    """Inventory movement type constants."""
    PURCHASE = "PURCHASE"
    SALE = "SALE"
    ADJUSTMENT = "ADJUSTMENT"
    RETURN = "RETURN"
    RESERVATION = "RESERVATION"
    RELEASE = "RELEASE"


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), unique=True, nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=0)
    reserved_quantity = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    product = relationship("Product", back_populates="inventory")

    @property
    def available_quantity(self) -> int:
        """Calculate available quantity (not reserved)."""
        return self.quantity - self.reserved_quantity

    def can_reserve(self, amount: int) -> bool:
        """Check if amount can be reserved."""
        return self.available_quantity >= amount

    def reserve(self, amount: int):
        """Reserve inventory for an order."""
        if not self.can_reserve(amount):
            raise ValueError(f"Insufficient inventory. Available: {self.available_quantity}, Requested: {amount}")
        self.reserved_quantity += amount

    def release(self, amount: int):
        """Release reserved inventory."""
        if amount > self.reserved_quantity:
            raise ValueError(f"Cannot release more than reserved. Reserved: {self.reserved_quantity}, Release: {amount}")
        self.reserved_quantity -= amount

    def deduct(self, amount: int):
        """Deduct from inventory (after sale confirmation)."""
        if amount > self.quantity:
            raise ValueError(f"Insufficient inventory. Available: {self.quantity}, Requested: {amount}")
        self.quantity -= amount
        self.reserved_quantity = max(0, self.reserved_quantity - amount)


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    movement_type = Column(String(20), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)  # Positive for inbound, negative for outbound
    reference_type = Column(String(50), index=True)  # order, adjustment, return, etc.
    reference_id = Column(UUID(as_uuid=True), index=True)
    previous_quantity = Column(Integer, nullable=False)
    new_quantity = Column(Integer, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    notes = Column(Text)

    # Relationships
    product = relationship("Product", back_populates="inventory_movements")
    creator = relationship("User", foreign_keys=[created_by])
