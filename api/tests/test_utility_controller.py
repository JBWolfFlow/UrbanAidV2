"""
Utility Controller Tests

Tests for utility CRUD operations including:
- Nearby utilities search (geo queries)
- Full-text search
- Utility creation and updates
- Utility reporting and verification
"""

import pytest
from datetime import datetime

from controllers.utility_controller import (
    get_nearby_utilities,
    search_utilities,
    get_utility_by_id,
    create_utility,
    update_utility,
    delete_utility,
    report_utility,
    verify_utility,
    get_app_statistics,
)
from models import Utility, UtilityReport, UserRole
from services.location_service import LocationService


class TestNearbyUtilities:
    """Tests for nearby utilities geo queries."""

    def test_get_nearby_utilities_success(self, db_session, test_utilities):
        """Test retrieving utilities within radius."""
        # Center point in NYC area
        lat, lng = 40.7128, -74.0060
        radius_km = 10

        results = get_nearby_utilities(
            db=db_session,
            latitude=lat,
            longitude=lng,
            radius_km=radius_km
        )

        assert results is not None
        assert len(results) > 0

    def test_get_nearby_utilities_with_category_filter(self, db_session, test_utilities):
        """Test filtering nearby utilities by category."""
        lat, lng = 40.7128, -74.0060
        radius_km = 50

        results = get_nearby_utilities(
            db=db_session,
            latitude=lat,
            longitude=lng,
            radius_km=radius_km,
            category="food_bank"
        )

        assert all(u.category == "food_bank" for u in results)

    def test_get_nearby_utilities_verified_only(self, db_session, test_utilities):
        """Test filtering for verified utilities only."""
        lat, lng = 40.7128, -74.0060
        radius_km = 50

        results = get_nearby_utilities(
            db=db_session,
            latitude=lat,
            longitude=lng,
            radius_km=radius_km,
            verified_only=True
        )

        assert all(u.verified is True for u in results)

    def test_get_nearby_utilities_respects_limit(self, db_session, test_utilities):
        """Test that limit parameter is respected."""
        lat, lng = 40.7128, -74.0060
        radius_km = 100
        limit = 3

        results = get_nearby_utilities(
            db=db_session,
            latitude=lat,
            longitude=lng,
            radius_km=radius_km,
            limit=limit
        )

        assert len(results) <= limit

    def test_get_nearby_utilities_sorted_by_distance(self, db_session, test_utilities):
        """Test that results are sorted by distance (closest first)."""
        lat, lng = 40.7128, -74.0060
        radius_km = 100

        results = get_nearby_utilities(
            db=db_session,
            latitude=lat,
            longitude=lng,
            radius_km=radius_km
        )

        if len(results) > 1:
            # Verify each utility is closer than the next
            location_service = LocationService()
            distances = [
                location_service.haversine_distance(
                    lat, lng, u.latitude, u.longitude
                )
                for u in results
            ]
            assert distances == sorted(distances)

    def test_get_nearby_utilities_empty_results(self, db_session):
        """Test query with no nearby utilities."""
        # Location far from any test data
        lat, lng = 0.0, 0.0
        radius_km = 1

        results = get_nearby_utilities(
            db=db_session,
            latitude=lat,
            longitude=lng,
            radius_km=radius_km
        )

        assert results is not None
        assert len(results) == 0

    def test_get_nearby_utilities_invalid_coordinates(self, db_session):
        """Test with invalid coordinates."""
        with pytest.raises(ValueError):
            get_nearby_utilities(
                db=db_session,
                latitude=100,  # Invalid: latitude must be -90 to 90
                longitude=-74.0060,
                radius_km=10
            )


class TestUtilitySearch:
    """Tests for utility search functionality."""

    def test_search_utilities_by_name(self, db_session, test_utility):
        """Test searching utilities by name."""
        results = search_utilities(db_session, query="Food Bank")

        assert len(results) > 0
        assert any("Food Bank" in u.name for u in results)

    def test_search_utilities_by_description(self, db_session, test_utility):
        """Test searching utilities by description."""
        results = search_utilities(db_session, query="unit testing")

        assert len(results) > 0

    def test_search_utilities_case_insensitive(self, db_session, test_utility):
        """Test that search is case insensitive."""
        results_upper = search_utilities(db_session, query="FOOD BANK")
        results_lower = search_utilities(db_session, query="food bank")

        assert len(results_upper) == len(results_lower)

    def test_search_utilities_with_geo_filter(self, db_session, test_utilities):
        """Test search with geographic filtering."""
        results = search_utilities(
            db=db_session,
            query="Utility",
            latitude=40.7128,
            longitude=-74.0060,
            radius_km=50
        )

        assert len(results) > 0

    def test_search_utilities_no_results(self, db_session):
        """Test search with no matching results."""
        results = search_utilities(
            db_session,
            query="xyznonexistentxyz"
        )

        assert len(results) == 0


class TestUtilityRetrieval:
    """Tests for utility retrieval functionality."""

    def test_get_utility_by_id_success(self, db_session, test_utility):
        """Test retrieving utility by ID."""
        utility = get_utility_by_id(db_session, test_utility.id)

        assert utility is not None
        assert utility.id == test_utility.id
        assert utility.name == test_utility.name

    def test_get_utility_by_id_not_found(self, db_session):
        """Test retrieving non-existent utility."""
        utility = get_utility_by_id(db_session, "nonexistent-id")

        assert utility is None

    def test_get_utility_increments_view_count(self, db_session, test_utility):
        """Test that retrieving utility increments view count."""
        original_count = test_utility.view_count or 0

        get_utility_by_id(db_session, test_utility.id, increment_views=True)

        db_session.refresh(test_utility)
        assert test_utility.view_count == original_count + 1


class TestUtilityCreation:
    """Tests for utility creation functionality."""

    def test_create_utility_success(self, db_session, test_user):
        """Test successful utility creation."""
        utility_data = {
            "name": "New Test Utility",
            "category": "shelter",
            "address": "456 New Street",
            "city": "New City",
            "state": "NC",
            "zip_code": "54321",
            "latitude": 40.7589,
            "longitude": -73.9851,
            "description": "A new test utility"
        }

        utility = create_utility(db_session, utility_data, test_user.id)

        assert utility is not None
        assert utility.name == "New Test Utility"
        assert utility.creator_id == test_user.id
        assert utility.verified is False  # New utilities start unverified

    def test_create_utility_generates_id(self, db_session, test_user):
        """Test that utility ID is auto-generated if not provided."""
        utility_data = {
            "name": "ID Test Utility",
            "category": "food_bank",
            "latitude": 40.7589,
            "longitude": -73.9851,
        }

        utility = create_utility(db_session, utility_data, test_user.id)

        assert utility.id is not None
        assert len(utility.id) > 0

    def test_create_utility_invalid_coordinates(self, db_session, test_user):
        """Test creating utility with invalid coordinates."""
        utility_data = {
            "name": "Invalid Coords",
            "category": "shelter",
            "latitude": 200,  # Invalid
            "longitude": -73.9851,
        }

        with pytest.raises(ValueError):
            create_utility(db_session, utility_data, test_user.id)


class TestUtilityUpdate:
    """Tests for utility update functionality."""

    def test_update_utility_success(self, db_session, test_utility, test_user):
        """Test successful utility update by owner."""
        updates = {"name": "Updated Food Bank Name"}

        updated = update_utility(
            db=db_session,
            utility_id=test_utility.id,
            updates=updates,
            user_id=test_user.id
        )

        assert updated.name == "Updated Food Bank Name"

    def test_update_utility_by_admin(self, db_session, test_utility, test_admin):
        """Test that admin can update any utility."""
        updates = {"name": "Admin Updated Name"}

        updated = update_utility(
            db=db_session,
            utility_id=test_utility.id,
            updates=updates,
            user_id=test_admin.id
        )

        assert updated.name == "Admin Updated Name"

    def test_update_utility_unauthorized(self, db_session, test_utility):
        """Test that non-owner cannot update utility."""
        from tests.conftest import create_test_user

        other_user = create_test_user(
            db_session,
            username="otheruser",
            email="other@example.com"
        )

        updates = {"name": "Unauthorized Update"}

        with pytest.raises(PermissionError):
            update_utility(
                db=db_session,
                utility_id=test_utility.id,
                updates=updates,
                user_id=other_user.id
            )

    def test_update_utility_not_found(self, db_session, test_user):
        """Test updating non-existent utility."""
        updates = {"name": "New Name"}

        with pytest.raises(Exception):  # Adjust to specific exception
            update_utility(
                db=db_session,
                utility_id="nonexistent",
                updates=updates,
                user_id=test_user.id
            )


class TestUtilityDeletion:
    """Tests for utility deletion functionality."""

    def test_delete_utility_success(self, db_session, test_utility, test_user):
        """Test successful utility deletion by owner."""
        result = delete_utility(
            db=db_session,
            utility_id=test_utility.id,
            user_id=test_user.id
        )

        assert result is True

        # Verify deletion
        deleted = get_utility_by_id(db_session, test_utility.id)
        assert deleted is None

    def test_delete_utility_by_admin(self, db_session, test_utility, test_admin):
        """Test that admin can delete any utility."""
        result = delete_utility(
            db=db_session,
            utility_id=test_utility.id,
            user_id=test_admin.id
        )

        assert result is True


class TestUtilityReporting:
    """Tests for utility reporting functionality."""

    def test_report_utility_success(self, db_session, test_utility, test_user):
        """Test successful utility report."""
        report = report_utility(
            db=db_session,
            utility_id=test_utility.id,
            reason="incorrect_info",
            description="The address is wrong",
            user_id=test_user.id
        )

        assert report is not None
        assert report.utility_id == test_utility.id
        assert report.reason == "incorrect_info"
        assert report.status == "pending"

    def test_report_utility_increments_count(self, db_session, test_utility, test_user):
        """Test that reporting increments utility report count."""
        original_count = test_utility.report_count or 0

        report_utility(
            db=db_session,
            utility_id=test_utility.id,
            reason="spam",
            user_id=test_user.id
        )

        db_session.refresh(test_utility)
        assert test_utility.report_count == original_count + 1


class TestUtilityVerification:
    """Tests for utility verification functionality."""

    def test_verify_utility_by_admin(self, db_session, test_utility, test_admin):
        """Test that admin can verify utility."""
        # Ensure utility is not verified
        test_utility.verified = False
        db_session.commit()

        result = verify_utility(
            db=db_session,
            utility_id=test_utility.id,
            admin_user_id=test_admin.id
        )

        assert result is True
        db_session.refresh(test_utility)
        assert test_utility.verified is True
        assert test_utility.verified_by_id == test_admin.id

    def test_verify_utility_non_admin_fails(self, db_session, test_utility, test_user):
        """Test that non-admin cannot verify utility."""
        with pytest.raises(PermissionError):
            verify_utility(
                db=db_session,
                utility_id=test_utility.id,
                admin_user_id=test_user.id
            )


class TestAppStatistics:
    """Tests for application statistics."""

    def test_get_app_statistics(self, db_session, test_utilities, test_user):
        """Test retrieving application statistics."""
        stats = get_app_statistics(db_session)

        assert stats is not None
        assert "total_utilities" in stats
        assert "total_users" in stats
        assert "utilities_by_category" in stats
        assert stats["total_utilities"] >= len(test_utilities)


class TestUtilityEndpoints:
    """Integration tests for utility API endpoints."""

    def test_list_nearby_utilities(self, client, test_utilities):
        """Test GET /utilities/nearby endpoint."""
        response = client.get(
            "/utilities/nearby",
            params={
                "latitude": 40.7128,
                "longitude": -74.0060,
                "radius": 50
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_search_utilities_endpoint(self, client, test_utility):
        """Test GET /utilities/search endpoint."""
        response = client.get(
            "/utilities/search",
            params={"q": "Food Bank"}
        )

        assert response.status_code == 200

    def test_get_utility_endpoint(self, client, test_utility):
        """Test GET /utilities/{id} endpoint."""
        response = client.get(f"/utilities/{test_utility.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_utility.id

    def test_create_utility_endpoint(self, client, auth_headers):
        """Test POST /utilities endpoint."""
        response = client.post(
            "/utilities",
            headers=auth_headers,
            json={
                "name": "API Test Utility",
                "category": "shelter",
                "latitude": 40.7589,
                "longitude": -73.9851,
                "address": "789 API Street",
                "city": "API City",
                "state": "AC",
                "zip_code": "98765"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "API Test Utility"

    def test_create_utility_unauthenticated(self, client):
        """Test that unauthenticated users cannot create utilities."""
        response = client.post(
            "/utilities",
            json={
                "name": "Unauth Test",
                "category": "shelter",
                "latitude": 40.7589,
                "longitude": -73.9851,
            }
        )

        assert response.status_code == 401

    def test_report_utility_endpoint(self, client, auth_headers, test_utility):
        """Test POST /utilities/{id}/report endpoint."""
        response = client.post(
            f"/utilities/{test_utility.id}/report",
            headers=auth_headers,
            json={
                "reason": "incorrect_info",
                "description": "Wrong phone number"
            }
        )

        assert response.status_code in [200, 201]
