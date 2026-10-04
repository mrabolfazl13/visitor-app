from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.services import customer as customer_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=dict)
async def list_customers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    owner_id: Optional[str] = None,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List customers with pagination."""
    return await customer_service.get_customers(session, current_user, page, per_page, search, owner_id)


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get customer by ID."""
    return await customer_service.get_customer(session, customer_id, current_user)


@router.post("", response_model=CustomerResponse)
async def create_customer(
    customer_data: CustomerCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create new customer."""
    return await customer_service.create_customer(session, customer_data, current_user)


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    customer_data: CustomerUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update customer."""
    return await customer_service.update_customer(session, customer_id, customer_data, current_user)


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft delete customer."""
    await customer_service.delete_customer(session, customer_id, current_user)
    return {"success": True, "message": "Customer deleted"}
