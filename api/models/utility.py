"""
Utility Model for Storing Public Utilities Data

This model represents community resources like:
- Public restrooms
- Water fountains
- Shelters
- Food banks
- Healthcare facilities
"""

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    Text, ForeignKey, Index
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base


class Utility(Base):
    """
    Utility resource model.

    Stores location-based community resources with:
    - Geographic coordinates for proximity search
    - Category classification
    - Accessibility information
    - Verification status
    - User contribution tracking
    """
    __tablename__ = "utilities"

    # Primary identification
    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)

    # External source ID (e.g., "1_12345" for OBA stop ID)
    external_id = Column(String(100), nullable=True, index=True)

    # Classification
    category = Column(String(50), nullable=False, index=True)
    subcategory = Column(String(50), nullable=True)

    # Location (indexed for geo queries)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Details
    description = Column(Text, nullable=True)
    address = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)
    website = Column(String(500), nullable=True)
    hours_of_operation = Column(Text, nullable=True)

    # Status
    verified = Column(Boolean, default=False, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    # Accessibility
    wheelchair_accessible = Column(Boolean, default=False, nullable=False)
    has_baby_changing = Column(Boolean, default=False, nullable=False)

    # User contribution tracking
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Statistics
    view_count = Column(Integer, default=0, nullable=False)
    report_count = Column(Integer, default=0, nullable=False)

    # Aggregate rating (denormalized for performance)
    average_rating = Column(Float, nullable=True)
    rating_count = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # Indexes for geo queries
    __table_args__ = (
        Index('idx_utility_location', 'latitude', 'longitude'),
        Index('idx_utility_category_active', 'category', 'is_active'),
    )

    def __repr__(self) -> str:
        return f"<Utility(id='{self.id}', name='{self.name}', category='{self.category}')>"


class UtilityReport(Base):
    """
    Report model for flagging problematic utilities.

    Users can report utilities for various reasons:
    - Incorrect information
    - Closed/no longer exists
    - Safety concerns
    - Inappropriate content
    """
    __tablename__ = "utility_reports"

    id = Column(Integer, primary_key=True, index=True)
    utility_id = Column(String(36), ForeignKey("utilities.id"), nullable=False, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    reason = Column(String(50), nullable=False)  # 'incorrect', 'closed', 'safety', 'spam', 'other'
    description = Column(Text, nullable=True)

    # Status tracking
    status = Column(String(20), default="pending", nullable=False)  # 'pending', 'reviewed', 'resolved', 'dismissed'
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<UtilityReport(id={self.id}, utility_id='{self.utility_id}', reason='{self.reason}')>"
