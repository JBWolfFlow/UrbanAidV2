"""
Rating Model for Utility Ratings and Reviews

This model supports:
- User ratings for utilities (1-5 stars)
- Text reviews/comments
- Update tracking
- Reporting functionality
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base


class Rating(Base):
    """
    Rating model for user reviews of utilities.

    Each user can only rate a utility once (enforced by unique constraint).
    Ratings can be updated but history is tracked via updated_at.
    """
    __tablename__ = "ratings"

    # Primary identification
    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    utility_id = Column(
        String(36),
        ForeignKey("utilities.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Rating content
    rating = Column(Float, nullable=False)  # 1.0 to 5.0
    comment = Column(Text, nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_flagged = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Unique constraint: one rating per user per utility
    __table_args__ = (
        Index('idx_rating_utility_user', 'utility_id', 'user_id', unique=True),
    )

    def __repr__(self) -> str:
        return f"<Rating(id={self.id}, utility_id='{self.utility_id}', rating={self.rating})>"
