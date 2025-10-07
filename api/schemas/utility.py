"""Utility schemas for request/response validation"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UtilityBase(BaseModel):
    name: str
    category: str
    latitude: float
    longitude: float
    description: Optional[str] = None

class UtilityCreate(UtilityBase):
    subcategory: Optional[str] = None
    wheelchair_accessible: Optional[bool] = False

class UtilityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    wheelchair_accessible: Optional[bool] = None

class UtilityResponse(UtilityBase):
    id: str
    subcategory: Optional[str]
    verified: bool
    wheelchair_accessible: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UtilityFilter(BaseModel):
    category: Optional[str] = None
    wheelchair_accessible: Optional[bool] = None
    verified: Optional[bool] = None 