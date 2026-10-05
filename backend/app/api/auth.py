from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.auth import LoginRequest, RefreshTokenRequest, ChangePasswordRequest
from app.schemas.user import UserResponse
from app.services import auth as auth_service
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=dict)
async def login(request: LoginRequest, session: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    return await auth_service.login(session, request.email, request.password)


@router.get("/me", response_model=UserResponse)
async def read_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user, used to restore a session on startup."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        mobile=current_user.mobile,
        is_active=current_user.is_active,
        roles=current_user.role_names,
    )


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
    current_user: User = Depends(get_current_user),
):
    """Change the authenticated user's password."""
    await auth_service.change_password(
        session, current_user, request.current_password, request.new_password
    )

    return {"success": True, "message": "Password changed successfully"}
