from sqlalchemy import Column, Integer, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class SyncStatus:
    """Sync operation status constants."""
    PENDING = "PENDING"
    SYNCING = "SYNCING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CONFLICT = "CONFLICT"


class SyncOperation(Base):
    __tablename__ = "sync_operations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    operation_type = Column(String(20), nullable=False)  # CREATE, UPDATE, DELETE
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(UUID(as_uuid=True), index=True)
    payload = Column(JSONB, nullable=False)
    idempotency_key = Column(String(255), unique=True, nullable=False, index=True)
    status = Column(String(20), default=SyncStatus.PENDING, index=True)
    retry_count = Column(Integer, default=0)
    last_error = Column(Text)
    synced_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
