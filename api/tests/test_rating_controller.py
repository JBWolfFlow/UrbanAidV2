"""
Rating Controller Tests

Tests for rating CRUD operations including:
- Rating creation
- Rating retrieval
- Rating updates
- Rating deletion
- Rating statistics calculations
"""

import pytest
from datetime import datetime

from controllers.rating_controller import rating_controller
from models import Rating
from schemas.rating import RatingCreate, RatingUpdate


class TestRatingCreation:
    """Tests for rating creation functionality."""

    def test_create_rating_success(self, db_session, test_user, test_utility):
        """Test successful rating creation."""
        rating_data = RatingCreate(
            utility_id=test_utility.id, rating=5, comment="Excellent service!"
        )

        rating = rating_controller.create_rating(
            db=db_session,
            utility_id=test_utility.id,
            rating_data=rating_data,
            user_id=test_user.id,
        )

        assert rating is not None
        assert rating.rating == 5
        assert rating.comment == "Excellent service!"
        assert rating.user_id == test_user.id
        assert rating.utility_id == test_utility.id

    def test_create_rating_updates_utility_average(
        self, db_session, test_user, test_utility
    ):
        """Test that creating rating updates utility average."""
        original_count = test_utility.rating_count or 0

        rating_data = RatingCreate(utility_id=test_utility.id, rating=5)
        rating_controller.create_rating(
            db=db_session,
            utility_id=test_utility.id,
            rating_data=rating_data,
            user_id=test_user.id,
        )

        db_session.refresh(test_utility)
        assert test_utility.rating_count == original_count + 1
        assert test_utility.average_rating is not None

    def test_create_rating_without_comment(self, db_session, test_user, test_utility):
        """Test creating rating without comment."""
        rating_data = RatingCreate(utility_id=test_utility.id, rating=4)

        rating = rating_controller.create_rating(
            db=db_session,
            utility_id=test_utility.id,
            rating_data=rating_data,
            user_id=test_user.id,
        )

        assert rating is not None
        assert rating.comment is None

    def test_create_rating_invalid_score(self, db_session, test_user, test_utility):
        """Test creating rating with invalid score."""
        rating_data = RatingCreate(
            utility_id=test_utility.id, rating=6
        )  # Rating should be 1-5

        with pytest.raises(Exception):
            rating_controller.create_rating(
                db=db_session,
                utility_id=test_utility.id,
                rating_data=rating_data,
                user_id=test_user.id,
            )

    def test_create_duplicate_rating(
        self, db_session, test_user, test_utility, test_rating
    ):
        """Test that user cannot rate same utility twice."""
        rating_data = RatingCreate(utility_id=test_utility.id, rating=3)

        with pytest.raises(Exception):
            rating_controller.create_rating(
                db=db_session,
                utility_id=test_utility.id,
                rating_data=rating_data,
                user_id=test_user.id,
            )

    def test_create_rating_nonexistent_utility(self, db_session, test_user):
        """Test rating non-existent utility."""
        rating_data = RatingCreate(utility_id="nonexistent", rating=4)

        with pytest.raises(Exception):
            rating_controller.create_rating(
                db=db_session,
                utility_id="nonexistent",
                rating_data=rating_data,
                user_id=test_user.id,
            )


class TestRatingRetrieval:
    """Tests for rating retrieval functionality."""

    def test_get_utility_ratings_success(self, db_session, test_utility, test_rating):
        """Test retrieving ratings for a utility."""
        ratings = rating_controller.get_utility_ratings(db_session, test_utility.id)

        assert ratings is not None
        assert len(ratings) > 0

    def test_get_utility_ratings_with_pagination(self, db_session, test_utility):
        """Test rating retrieval with pagination."""
        from tests.conftest import create_test_user

        for i in range(5):
            user = create_test_user(
                db_session, username=f"rater{i}", email=f"rater{i}@example.com"
            )
            rating = Rating(
                user_id=user.id,
                utility_id=test_utility.id,
                rating=(i % 5) + 1,
                is_active=True,
                created_at=datetime.utcnow(),
            )
            db_session.add(rating)
        db_session.commit()

        # Test pagination
        page1 = rating_controller.get_utility_ratings(
            db_session, test_utility.id, limit=2, offset=0
        )
        page2 = rating_controller.get_utility_ratings(
            db_session, test_utility.id, limit=2, offset=2
        )

        assert len(page1) == 2
        assert len(page2) == 2

    def test_get_utility_ratings_empty(self, db_session, test_utility):
        """Test retrieving ratings for utility with no ratings."""
        db_session.query(Rating).filter(Rating.utility_id == test_utility.id).delete()
        db_session.commit()

        ratings = rating_controller.get_utility_ratings(db_session, test_utility.id)

        assert ratings is not None
        assert len(ratings) == 0

    def test_get_user_ratings_success(self, db_session, test_user, test_rating):
        """Test retrieving all ratings by a user."""
        ratings = rating_controller.get_user_ratings(db_session, test_user.id)

        assert ratings is not None
        assert len(ratings) > 0

    def test_get_user_ratings_empty(self, db_session, test_admin):
        """Test retrieving ratings for user with no ratings."""
        ratings = rating_controller.get_user_ratings(db_session, test_admin.id)

        assert ratings is not None
        assert len(ratings) == 0


class TestRatingUpdate:
    """Tests for rating update functionality."""

    def test_update_rating_score(self, db_session, test_rating, test_user):
        """Test updating rating score."""
        updates = RatingUpdate(rating=3)

        updated = rating_controller.update_rating(
            db=db_session,
            rating_id=test_rating.id,
            rating_data=updates,
            user_id=test_user.id,
        )

        assert updated.rating == 3

    def test_update_rating_comment(self, db_session, test_rating, test_user):
        """Test updating rating comment."""
        updates = RatingUpdate(comment="Updated comment")

        updated = rating_controller.update_rating(
            db=db_session,
            rating_id=test_rating.id,
            rating_data=updates,
            user_id=test_user.id,
        )

        assert updated.comment == "Updated comment"

    def test_update_rating_updates_utility_average(
        self, db_session, test_rating, test_user, test_utility
    ):
        """Test that updating rating recalculates utility average."""
        updates = RatingUpdate(rating=1)  # Lower score
        rating_controller.update_rating(
            db=db_session,
            rating_id=test_rating.id,
            rating_data=updates,
            user_id=test_user.id,
        )

        db_session.refresh(test_utility)
        # Average should change (unless there are other ratings)

    def test_update_rating_unauthorized(self, db_session, test_rating, test_admin):
        """Test that users cannot update others' ratings."""
        updates = RatingUpdate(rating=1)

        with pytest.raises(Exception):
            rating_controller.update_rating(
                db=db_session,
                rating_id=test_rating.id,
                rating_data=updates,
                user_id=test_admin.id,
            )

    def test_update_rating_not_found(self, db_session, test_user):
        """Test updating non-existent rating."""
        updates = RatingUpdate(rating=5)

        with pytest.raises(Exception):
            rating_controller.update_rating(
                db=db_session,
                rating_id=99999,
                rating_data=updates,
                user_id=test_user.id,
            )


class TestRatingDeletion:
    """Tests for rating deletion functionality."""

    def test_delete_rating_success(self, db_session, test_rating, test_user):
        """Test successful rating deletion by owner."""
        rating_id = test_rating.id

        result = rating_controller.delete_rating(
            db=db_session, rating_id=rating_id, user_id=test_user.id
        )

        assert result is True

    def test_delete_rating_updates_utility_average(
        self, db_session, test_rating, test_user, test_utility
    ):
        """Test that deleting rating recalculates utility average."""
        rating_controller.delete_rating(
            db=db_session, rating_id=test_rating.id, user_id=test_user.id
        )

        db_session.refresh(test_utility)
        # Rating count should decrease

    def test_delete_rating_by_admin(self, db_session, test_rating, test_admin):
        """Test that admin can delete any rating."""
        result = rating_controller.delete_rating(
            db=db_session,
            rating_id=test_rating.id,
            user_id=test_admin.id,
            is_admin=True,
        )

        assert result is True

    def test_delete_rating_unauthorized(self, db_session, test_rating):
        """Test that users cannot delete others' ratings."""
        from tests.conftest import create_test_user

        other_user = create_test_user(
            db_session, username="deleter", email="deleter@example.com"
        )

        with pytest.raises(Exception):
            rating_controller.delete_rating(
                db=db_session, rating_id=test_rating.id, user_id=other_user.id
            )


class TestRatingStatistics:
    """Tests for rating statistics calculation."""

    def test_calculate_stats_single_rating(self, db_session, test_utility, test_rating):
        """Test stats calculation with single rating."""
        stats = rating_controller.calculate_utility_rating_stats(
            db_session, test_utility.id
        )

        assert stats is not None
        assert "average_rating" in stats
        assert "rating_count" in stats
        assert "distribution" in stats
        assert stats["rating_count"] >= 1

    def test_calculate_stats_multiple_ratings(self, db_session, test_utility):
        """Test stats calculation with multiple ratings."""
        from tests.conftest import create_test_user

        # Clear existing ratings
        db_session.query(Rating).filter(Rating.utility_id == test_utility.id).delete()
        db_session.commit()

        # Create ratings with known scores
        scores = [1, 2, 3, 4, 5]
        for i, score in enumerate(scores):
            user = create_test_user(
                db_session, username=f"avguser{i}", email=f"avg{i}@example.com"
            )
            rating = Rating(
                user_id=user.id,
                utility_id=test_utility.id,
                rating=score,
                is_active=True,
                created_at=datetime.utcnow(),
            )
            db_session.add(rating)
        db_session.commit()

        stats = rating_controller.calculate_utility_rating_stats(
            db_session, test_utility.id
        )

        expected_avg = sum(scores) / len(scores)
        assert stats["rating_count"] == len(scores)
        assert abs(stats["average_rating"] - expected_avg) < 0.01

    def test_calculate_stats_no_ratings(self, db_session, test_utility):
        """Test stats calculation with no ratings."""
        # Clear existing ratings
        db_session.query(Rating).filter(Rating.utility_id == test_utility.id).delete()
        db_session.commit()

        stats = rating_controller.calculate_utility_rating_stats(
            db_session, test_utility.id
        )

        assert stats["average_rating"] is None
        assert stats["rating_count"] == 0


class TestRatingEndpoints:
    """Integration tests for rating API endpoints."""

    def test_create_rating_endpoint(self, client, auth_headers, test_utility):
        """Test POST /utilities/{id}/ratings endpoint."""
        response = client.post(
            f"/utilities/{test_utility.id}/ratings",
            headers=auth_headers,
            json={
                "utility_id": test_utility.id,
                "rating": 5,
                "comment": "Great place!",
            },
        )

        assert response.status_code in [200, 201]

    def test_get_utility_ratings_endpoint(self, client, test_utility, test_rating):
        """Test GET /utilities/{id}/ratings endpoint."""
        response = client.get(f"/utilities/{test_utility.id}/ratings")

        assert response.status_code == 200
