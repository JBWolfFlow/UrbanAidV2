"""Utility schemas for request/response validation"""

from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

VALID_CATEGORIES = {
    "water_fountain",
    "restroom",
    "bench",
    "wifi",
    "charging",
    "transit",
    "library",
    "shelter",
    "free_food",
    "clinic",
    "medical",
    "food",
    "health_center",
    "community_health_center",
    "va_facility",
    "va_medical_center",
    "va_outpatient_clinic",
    "va_vet_center",
    "usda_snap_office",
    "usda_wic_office",
    "usda_farm_service_center",
    "shower",
    "laundry",
    "haircut",
    "legal",
    "social_services",
    "job_training",
    "mental_health",
    "addiction_services",
    "suicide_prevention",
    "domestic_violence",
    "warming_center",
    "cooling_center",
    "disaster_relief",
    "needle_exchange",
    "pet_services",
    "dental",
    "eye_care",
    "tax_help",
    "other",
}


class UtilityBase(BaseModel):
    name: str
    category: str
    latitude: float
    longitude: float
    description: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(
                f"Invalid category '{v}'. Must be one of: {sorted(VALID_CATEGORIES)}"
            )
        return v


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
    external_id: Optional[str] = None
    verified: bool
    wheelchair_accessible: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UtilityFilter(BaseModel):
    category: Optional[str] = None
    wheelchair_accessible: Optional[bool] = None
    verified: Optional[bool] = None
