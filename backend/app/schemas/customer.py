from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class CustomerAddressBase(BaseModel):
    province: str
    city: str
    postal_code: Optional[str] = None
    street_address: str
    is_default: bool = False


class CustomerAddressCreate(CustomerAddressBase):
    pass


class CustomerAddressResponse(CustomerAddressBase):
    id: UUID
    customer_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    mobile: str = Field(..., min_length=10, max_length=20)
    company_name: Optional[str] = None
    national_id: Optional[str] = None
    economic_id: Optional[str] = None
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    addresses: list[CustomerAddressCreate] = []


class CustomerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    mobile: Optional[str] = None
    company_name: Optional[str] = None
    national_id: Optional[str] = None
    economic_id: Optional[str] = None
    notes: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    addresses: list[CustomerAddressResponse] = []

    class Config:
        from_attributes = True
