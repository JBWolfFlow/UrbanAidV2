"""Utility model for storing public utilities data"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from .database import Base

class Utility(Base):
    __tablename__ = "utilities"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    subcategory = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    description = Column(Text)
    verified = Column(Boolean, default=False)
    wheelchair_accessible = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 