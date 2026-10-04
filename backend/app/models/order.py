from sqlalchemy import Column, Integer, String, Text, Integer, Numeric, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class OrderStatus:
    """Order state machine statuses."""
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    ACCOUNTING = "ACCOUNTING"
    WAREHOUSE = "WAREHOUSE"
    READY_TO_SHIP = "READY_TO_SHIP"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

    VALID_TRANSITIONS = {
        DRAFT: [PENDING_APPROVAL, CANCELLED],
        PENDING_APPROVAL: [APPROVED, REJECTED, CANCELLED],
        APPROVED: [ACCOUNTING],
        ACCOUNTING: [WAREHOUSE],
        WAREHOUSE: [READY_TO_SHIP],
        READY_TO_SHIP: [SHIPPED],
        SHIPPED: [DELIVERED],
    }

    @classmethod
    def can_transition(cls, from_status: str, to_status: str) -> bool:
        """Check if transition is valid."""
        if from_status not in cls.VALID_TRANSITIONS:
            return False
        return to_status in cls.VALID_TRANSITIONS[from_status]


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False, index=True)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(30), nullable=False, index=True, default=OrderStatus.DRAFT)
    total_amount = Column(Numeric(14, 2))
    rejection_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    approved_at = Column(DateTime(timezone=True))
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)

    # Relationships
    customer = relationship("Customer", back_populates="orders")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="created_orders")
    approver = relationship("User", foreign_keys=[approved_by], back_populates="approved_orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="order", uselist=False)
    shipment = relationship("Shipment", back_populates="order", uselist=False)

    def can_transition_to(self, new_status: str) -> bool:
        """Check if order can transition to new status."""
        return OrderStatus.can_transition(self.status, new_status)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)  # Price snapshot at order time
    subtotal = Column(Numeric(14, 2), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
