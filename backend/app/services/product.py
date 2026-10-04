from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.product import Product, ProductImage, Category
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate


async def get_products(
    session: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    status: Optional[str] = None,
    in_stock: Optional[bool] = None,
    sort: str = "created_at",
    order: str = "desc",
) -> dict:
    """Get paginated product list with filters."""
    query = select(Product).where(Product.deleted_at.is_(None))

    # Apply filters
    if search:
        query = query.where(Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%"))

    if category_id:
        query = query.where(Product.category_id == category_id)

    if status:
        query = query.where(Product.status == status)

    if in_stock:
        query = query.where(Product.stock_quantity > 0)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar()

    # Apply sorting
    sort_column = getattr(Product, sort, Product.created_at)
    if order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    query = query.options(selectinload(Product.images))

    result = await session.execute(query)
    products = result.scalars().all()

    return {
        "data": products,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page,
        }
    }


async def get_product(session: AsyncSession, product_id: str) -> Product:
    """Get single product by ID."""
    result = await session.execute(
        select(Product)
        .where(Product.id == product_id, Product.deleted_at.is_(None))
        .options(selectinload(Product.images))
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return product


async def create_product(session: AsyncSession, product_data: ProductCreate, created_by: User) -> Product:
    """Create new product (Admin only)."""
    # Check if SKU already exists
    existing = await session.execute(
        select(Product).where(Product.sku == product_data.sku, Product.deleted_at.is_(None))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU already exists")

    product = Product(
        sku=product_data.sku,
        name=product_data.name,
        description=product_data.description,
        category_id=product_data.category_id,
        unit_price=product_data.unit_price,
        unit=product_data.unit,
        minimum_order_quantity=product_data.minimum_order_quantity,
        stock_quantity=product_data.stock_quantity,
        status=product_data.status,
        created_by=created_by.id,
    )

    session.add(product)
    await session.flush()

    return product


async def update_product(session: AsyncSession, product_id: str, product_data: ProductUpdate) -> Product:
    """Update product (Admin only)."""
    product = await get_product(session, product_id)

    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    await session.flush()
    return product


async def delete_product(session: AsyncSession, product_id: str) -> bool:
    """Soft delete product (Admin only)."""
    product = await get_product(session, product_id)
    from sqlalchemy.sql import func
    product.deleted_at = func.now()
    await session.flush()
    return True
