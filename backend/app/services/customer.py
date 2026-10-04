from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.customer import Customer, CustomerAddress
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate


async def get_customers(
    session: AsyncSession,
    current_user: User,
    page: int = 1,
    per_page: int = 20,
    search: Optional[str] = None,
    owner_id: Optional[str] = None,
) -> dict:
    """Get paginated customer list with filters."""
    query = select(Customer).where(Customer.deleted_at.is_(None))

    # Filter by ownership (Seller sees only their customers, Admin sees all)
    if not current_user.has_role("ADMIN"):
        query = query.where(Customer.owner_id == current_user.id)
    elif owner_id:
        query = query.where(Customer.owner_id == owner_id)

    # Apply search
    if search:
        from sqlalchemy import or_
        query = query.where(
            or_(
                Customer.first_name.ilike(f"%{search}%"),
                Customer.last_name.ilike(f"%{search}%"),
                Customer.mobile.ilike(f"%{search}%"),
                Customer.company_name.ilike(f"%{search}%"),
            )
        )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar()

    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    query = query.options(selectinload(Customer.addresses))

    result = await session.execute(query)
    customers = result.scalars().all()

    return {
        "data": customers,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page,
        }
    }


async def get_customer(session: AsyncSession, customer_id: str, current_user: User) -> Customer:
    """Get single customer by ID with ownership check."""
    result = await session.execute(
        select(Customer)
        .where(Customer.id == customer_id, Customer.deleted_at.is_(None))
        .options(selectinload(Customer.addresses))
    )
    customer = result.scalar_one_or_none()

    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    # Check ownership
    if not current_user.has_role("ADMIN") and customer.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return customer


async def create_customer(session: AsyncSession, customer_data: CustomerCreate, owner: User) -> Customer:
    """Create new customer."""
    # Check if mobile already exists for this owner
    existing = await session.execute(
        select(Customer).where(
            Customer.mobile == customer_data.mobile,
            Customer.owner_id == owner.id,
            Customer.deleted_at.is_(None)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Customer with this mobile number already exists"
        )

    customer = Customer(
        first_name=customer_data.first_name,
        last_name=customer_data.last_name,
        mobile=customer_data.mobile,
        company_name=customer_data.company_name,
        national_id=customer_data.national_id,
        economic_id=customer_data.economic_id,
        owner_id=owner.id,
        notes=customer_data.notes,
    )

    session.add(customer)
    await session.flush()

    # Add addresses
    for addr_data in customer_data.addresses:
        address = CustomerAddress(
            customer_id=customer.id,
            province=addr_data.province,
            city=addr_data.city,
            postal_code=addr_data.postal_code,
            street_address=addr_data.street_address,
            is_default=addr_data.is_default,
        )
        session.add(address)

    await session.flush()
    return customer


async def update_customer(session: AsyncSession, customer_id: str, customer_data: CustomerUpdate, current_user: User) -> Customer:
    """Update customer with ownership check."""
    customer = await get_customer(session, customer_id, current_user)

    update_data = customer_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)

    await session.flush()
    return customer


async def delete_customer(session: AsyncSession, customer_id: str, current_user: User) -> bool:
    """Soft delete customer with ownership check."""
    customer = await get_customer(session, customer_id, current_user)
    from sqlalchemy.sql import func
    customer.deleted_at = func.now()
    await session.flush()
    return True
