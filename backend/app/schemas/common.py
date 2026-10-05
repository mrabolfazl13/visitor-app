from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int
    per_page: int
    total: int
    total_pages: int


class Page(BaseModel, Generic[T]):
    data: list[T]
    pagination: PaginationMeta
