from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.services import product as product_service
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=dict)
async def list_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    status: Optional[str] = None,
    in_stock: Optional[bool] = None,
    sort: str = "created_at",
    order: str = "desc",
    session: AsyncSession = Depends(get_db),
):
    """List products with pagination and filters."""
    return await product_service.get_products(
        session, page, per_page, search, category_id, status, in_stock, sort, order
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, session: AsyncSession = Depends(get_db)):
    """Get product by ID."""
    return await product_service.get_product(session, product_id)


@router.post("", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Create new product (Admin only)."""
    return await product_service.create_product(session, product_data, current_user)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_data: ProductUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Update product (Admin only)."""
    return await product_service.update_product(session, product_id, product_data)


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Soft delete product (Admin only)."""
    await product_service.delete_product(session, product_id)
    return {"success": True, "message": "Product deleted"}


@router.post("/{product_id}/images")
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Upload product image to MinIO."""
    # This will be implemented with MinIO integration
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Image upload not yet implemented")
