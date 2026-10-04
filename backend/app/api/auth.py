from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest, ChangePasswordRequest
from app.services import auth as auth_service
from app.models.user import User
from app.core.security import decode_token
from sqlalchemy import select

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=dict)
async def login(request: LoginRequest, session: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    return await auth_service.login(session, request.email, request.password)


@router.post("/refresh", response_model=dict)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token."""
    return await auth_service.refresh_access_token(request.refresh_token)


@router.post("/logout")
async def logout():
    """Logout (client should discard tokens)."""
    return {"success": True, "message": "Logged out successfully"}


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    session: AsyncSession = Depends(get_db),
    current_user_id: str = None,  # Will be set by dependency
):
    """Change user password."""
    # Get current user from token
    result = await session.execute(select(User).where(User.id == current_user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    await auth_service.change_password(session, user, request.current_password, request.new_password)

    return {"success": True, "message": "Password changed successfully"}
