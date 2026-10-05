from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.product import Category
from app.schemas.product import CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(session: AsyncSession = Depends(get_db)):
    """List active product categories."""
    result = await session.execute(
        select(Category)
        .where(Category.deleted_at.is_(None), Category.is_active == True)
        .order_by(Category.name)
    )
    return result.scalars().all()
