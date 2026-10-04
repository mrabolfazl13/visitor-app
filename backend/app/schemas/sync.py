from pydantic import BaseModel
from typing import Optional, Any
from uuid import UUID
from datetime import datetime


class SyncOperationCreate(BaseModel):
    operation_type: str  # CREATE, UPDATE, DELETE
    entity_type: str
    entity_id: Optional[UUID] = None
    payload: dict[str, Any]
    idempotency_key: str


class SyncBatchRequest(BaseModel):
    operations: list[SyncOperationCreate]


class SyncOperationResult(BaseModel):
    idempotency_key: str
    status: str  # SUCCESS, FAILED, CONFLICT
    server_id: Optional[UUID] = None
    error: Optional[str] = None


class SyncBatchResponse(BaseModel):
    success: bool
    results: list[SyncOperationResult]
