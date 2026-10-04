from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    mobile: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role_ids: list[UUID]


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    mobile: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    is_active: bool
    roles: list[str]

    class Config:
        from_attributes = True


class UserInDB(UserBase):
    id: UUID
    password_hash: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
