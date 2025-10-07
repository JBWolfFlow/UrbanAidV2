"""Rating model for utility ratings and reviews"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    utility_id = Column(String, ForeignKey("utilities.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    rating = Column(Float)
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now()) 