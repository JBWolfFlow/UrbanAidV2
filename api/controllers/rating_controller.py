"""
Rating Controller for Rating and Review Management

This controller provides:
- CRUD operations for ratings
- Rating statistics calculation
- User rating history
- Rating moderation
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.rating import Rating
from models.utility import Utility
from schemas.rating import RatingCreate, RatingUpdate
from utils.exceptions import (
    RatingNotFoundError,
    UtilityNotFoundError,
    UnauthorizedError,
    ValidationError,
)


class RatingController:
    """Controller for rating-related operations"""

    # =========================================================================
    # Validation
    # =========================================================================

    @staticmethod
    def validate_rating_value(rating: float) -> None:
        """Validate rating is within allowed range (1-5)."""
        if not (1.0 <= rating <= 5.0):
            raise ValidationError("Rating must be between 1 and 5")

    # =========================================================================
    # Create and Update
    # =========================================================================

    def create_rating(
        self, db: Session, utility_id: str, rating_data: RatingCreate, user_id: int
    ) -> Rating:
        """
        Create a new rating for a utility.

        Users can only rate each utility once. If they've already rated,
        this will raise an error (use update_rating instead).

        Args:
            db: Database session
            utility_id: ID of utility to rate
            rating_data: Rating data (rating value and optional comment)
            user_id: ID of user creating the rating

        Returns:
            Created Rating object

        Raises:
            UtilityNotFoundError: If utility doesn't exist
            ValidationError: If rating value is invalid or user already rated
        """
        self.validate_rating_value(rating_data.rating)

        # Verify utility exists
        utility = db.query(Utility).filter(Utility.id == utility_id).first()
        if not utility:
            raise UtilityNotFoundError()

        # Check for existing rating by this user
        existing = (
            db.query(Rating)
            .filter(Rating.utility_id == utility_id, Rating.user_id == user_id)
            .first()
        )

        if existing:
            raise ValidationError(
                "You have already rated this utility. Use update to modify your rating."
            )

        # Create rating
        rating = Rating(
            utility_id=utility_id,
            user_id=user_id,
            rating=rating_data.rating,
            comment=rating_data.comment,
            is_active=True,
        )

        db.add(rating)
        db.commit()
        db.refresh(rating)

        # Update utility's aggregate rating
        self._update_utility_rating_stats(db, utility_id)

        return rating

    def update_rating(
        self, db: Session, rating_id: int, rating_data: RatingUpdate, user_id: int
    ) -> Rating:
        """
        Update an existing rating.

        Users can only update their own ratings.

        Args:
            db: Database session
            rating_id: ID of rating to update
            rating_data: Updated rating data
            user_id: ID of user making the update

        Returns:
            Updated Rating object

        Raises:
            RatingNotFoundError: If rating doesn't exist
            UnauthorizedError: If user doesn't own the rating
        """
        rating = db.query(Rating).filter(Rating.id == rating_id).first()

        if not rating:
            raise RatingNotFoundError()

        if rating.user_id != user_id:
            raise UnauthorizedError("You can only update your own ratings")

        # Apply updates
        if rating_data.rating is not None:
            self.validate_rating_value(rating_data.rating)
            rating.rating = rating_data.rating

        if rating_data.comment is not None:
            rating.comment = rating_data.comment

        db.commit()
        db.refresh(rating)

        # Update utility's aggregate rating
        self._update_utility_rating_stats(db, rating.utility_id)

        return rating

    def delete_rating(
        self, db: Session, rating_id: int, user_id: int, is_admin: bool = False
    ) -> bool:
        """
        Delete a rating (soft delete).

        Users can delete their own ratings. Admins can delete any rating.

        Args:
            db: Database session
            rating_id: ID of rating to delete
            user_id: ID of user making the deletion
            is_admin: Whether user has admin role

        Returns:
            True if successful

        Raises:
            RatingNotFoundError: If rating doesn't exist
            UnauthorizedError: If user can't delete this rating
        """
        rating = db.query(Rating).filter(Rating.id == rating_id).first()

        if not rating:
            raise RatingNotFoundError()

        if not is_admin and rating.user_id != user_id:
            raise UnauthorizedError("You can only delete your own ratings")

        utility_id = rating.utility_id

        # Soft delete
        rating.is_active = False
        db.commit()

        # Update utility's aggregate rating
        self._update_utility_rating_stats(db, utility_id)

        return True

    # =========================================================================
    # Retrieval
    # =========================================================================

    def get_rating_by_id(self, db: Session, rating_id: int) -> Optional[Rating]:
        """Get a rating by its ID."""
        return (
            db.query(Rating)
            .filter(Rating.id == rating_id, Rating.is_active == True)
            .first()
        )

    def get_utility_ratings(
        self, db: Session, utility_id: str, limit: int = 20, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get all ratings for a utility.

        Args:
            db: Database session
            utility_id: Utility to get ratings for
            limit: Maximum results to return
            offset: Pagination offset

        Returns:
            List of rating dictionaries with user info
        """
        ratings = (
            db.query(Rating)
            .filter(Rating.utility_id == utility_id, Rating.is_active == True)
            .order_by(Rating.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return [
            {
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "user_id": r.user_id,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            }
            for r in ratings
        ]

    def get_user_ratings(
        self, db: Session, user_id: int, limit: int = 50, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get all ratings by a user.

        Args:
            db: Database session
            user_id: User whose ratings to retrieve
            limit: Maximum results
            offset: Pagination offset

        Returns:
            List of rating dictionaries with utility info
        """
        ratings = (
            db.query(Rating)
            .filter(Rating.user_id == user_id, Rating.is_active == True)
            .order_by(Rating.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return [
            {
                "id": r.id,
                "utility_id": r.utility_id,
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in ratings
        ]

    def get_user_rating_for_utility(
        self, db: Session, utility_id: str, user_id: int
    ) -> Optional[Rating]:
        """Get a user's rating for a specific utility."""
        return (
            db.query(Rating)
            .filter(
                Rating.utility_id == utility_id,
                Rating.user_id == user_id,
                Rating.is_active == True,
            )
            .first()
        )

    # =========================================================================
    # Statistics
    # =========================================================================

    def calculate_utility_rating_stats(
        self, db: Session, utility_id: str
    ) -> Dict[str, Any]:
        """
        Calculate rating statistics for a utility.

        Returns:
            Dictionary with average, count, and distribution
        """
        stats = (
            db.query(
                func.avg(Rating.rating).label("average"),
                func.count(Rating.id).label("count"),
            )
            .filter(Rating.utility_id == utility_id, Rating.is_active == True)
            .first()
        )

        # Get distribution (count of each rating value)
        distribution = (
            db.query(
                func.floor(Rating.rating).label("star"),
                func.count(Rating.id).label("count"),
            )
            .filter(Rating.utility_id == utility_id, Rating.is_active == True)
            .group_by(func.floor(Rating.rating))
            .all()
        )

        distribution_dict = {int(star): count for star, count in distribution}

        return {
            "average_rating": round(float(stats.average), 2) if stats.average else None,
            "rating_count": stats.count or 0,
            "distribution": {
                "1": distribution_dict.get(1, 0),
                "2": distribution_dict.get(2, 0),
                "3": distribution_dict.get(3, 0),
                "4": distribution_dict.get(4, 0),
                "5": distribution_dict.get(5, 0),
            },
        }

    def _update_utility_rating_stats(self, db: Session, utility_id: str) -> None:
        """
        Update denormalized rating stats on utility.

        Called after creating, updating, or deleting ratings.
        """
        stats = self.calculate_utility_rating_stats(db, utility_id)

        utility = db.query(Utility).filter(Utility.id == utility_id).first()
        if utility:
            utility.average_rating = stats["average_rating"]
            utility.rating_count = stats["rating_count"]
            db.commit()

    # =========================================================================
    # Moderation
    # =========================================================================

    def flag_rating(self, db: Session, rating_id: int, reason: str) -> bool:
        """
        Flag a rating for moderation review.

        Args:
            db: Database session
            rating_id: Rating to flag
            reason: Reason for flagging

        Returns:
            True if successful
        """
        rating = db.query(Rating).filter(Rating.id == rating_id).first()

        if not rating:
            raise RatingNotFoundError()

        rating.is_flagged = True
        db.commit()

        return True

    def get_flagged_ratings(
        self, db: Session, limit: int = 50, offset: int = 0
    ) -> List[Rating]:
        """Get all flagged ratings for moderation."""
        return (
            db.query(Rating)
            .filter(Rating.is_flagged == True, Rating.is_active == True)
            .offset(offset)
            .limit(limit)
            .all()
        )


# Singleton instance for dependency injection
rating_controller = RatingController()
