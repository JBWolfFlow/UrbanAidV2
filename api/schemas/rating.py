"""Rating schemas for utility ratings"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RatingBase(BaseModel):
    rating: float
    comment: Optional[str] = None


class RatingCreate(RatingBase):
    utility_id: str


class RatingUpdate(BaseModel):
    rating: Optional[float] = None
    comment: Optional[str] = None


class RatingResponse(RatingBase):
    id: int
    utility_id: str
    user_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
