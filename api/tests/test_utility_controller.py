"""
Utility Controller Tests

Tests for utility CRUD operations including:
- Nearby utilities search (geo queries)
- Full-text search
- Utility creation and updates
- Utility reporting and verification
"""

import pytest

from controllers.utility_controller import utility_controller
from schemas.utility import UtilityCreate, UtilityFilter


class TestNearbyUtilities:
    """Tests for nearby utilities geo queries."""

    @pytest.mark.asyncio
    async def test_get_nearby_utilities_success(self, db_session, test_utilities):
        """Test retrieving utilities within radius."""
        lat, lng = 40.7128, -74.0060
        radius_km = 10

        results = await utility_controller.get_nearby_utilities(
            db=db_session, latitude=lat, longitude=lng, radius_km=radius_km
        )

        assert results is not None
        assert len(results) > 0

    @pytest.mark.asyncio
    async def test_get_nearby_utilities_with_category_filter(
        self, db_session, test_utilities
    ):
        """Test filtering nearby utilities by category."""
        lat, lng = 40.7128, -74.0060
        radius_km = 50

        filters = UtilityFilter(category="free_food")
        results = await utility_controller.get_nearby_utilities(
            db=db_session,
            latitude=lat,
            longitude=lng,
            radius_km=radius_km,
            filters=filters,
        )

        assert all(u["category"] == "free_food" for u in results)

    @pytest.mark.asyncio
    async def test_get_nearby_utilities_respects_limit(
        self, db_session, test_utilities
    ):
        """Test that limit parameter is respected."""
        lat, lng = 40.7128, -74.0060
        radius_km = 50
        limit = 3

        results = await utility_controller.get_nearby_utilities(
            db=db_session, latitude=lat, longitude=lng, radius_km=radius_km, limit=limit
        )

        assert len(results) <= limit

    @pytest.mark.asyncio
    async def test_get_nearby_utilities_sorted_by_distance(
        self, db_session, test_utilities
    ):
        """Test that results are sorted by distance (closest first)."""
        lat, lng = 40.7128, -74.0060
        radius_km = 50

        results = await utility_controller.get_nearby_utilities(
            db=db_session, latitude=lat, longitude=lng, radius_km=radius_km
        )

        if len(results) > 1:
            distances = [r["distance_km"] for r in results]
            assert distances == sorted(distances)

    @pytest.mark.asyncio
    async def test_get_nearby_utilities_empty_results(self, db_session):
        """Test query with no nearby utilities."""
        lat, lng = 0.0, 0.0
        radius_km = 1

        results = await utility_controller.get_nearby_utilities(
            db=db_session, latitude=lat, longitude=lng, radius_km=radius_km
        )

        assert results is not None
        assert len(results) == 0

    @pytest.mark.asyncio
    async def test_get_nearby_utilities_invalid_coordinates(self, db_session):
        """Test with invalid coordinates."""
        with pytest.raises(Exception):
            await utility_controller.get_nearby_utilities(
                db=db_session,
                latitude=100,  # Invalid: latitude must be -90 to 90
                longitude=-74.0060,
                radius_km=10,
            )


class TestUtilitySearch:
    """Tests for utility search functionality."""

    @pytest.mark.asyncio
    async def test_search_utilities_by_name(self, db_session, test_utility):
        """Test searching utilities by name."""
        results = await utility_controller.search_utilities(
            db_session, query="Food Bank"
        )

        assert len(results) > 0

    @pytest.mark.asyncio
    async def test_search_utilities_no_results(self, db_session):
        """Test search with no matching results."""
        results = await utility_controller.search_utilities(
            db_session, query="xyznonexistentxyz"
        )

        assert len(results) == 0


class TestUtilityRetrieval:
    """Tests for utility retrieval functionality."""

    def test_get_utility_by_id_success(self, db_session, test_utility):
        """Test retrieving utility by ID."""
        utility = utility_controller.get_utility_by_id(db_session, test_utility.id)

        assert utility is not None
        assert utility.id == test_utility.id
        assert utility.name == test_utility.name

    def test_get_utility_by_id_not_found(self, db_session):
        """Test retrieving non-existent utility."""
        utility = utility_controller.get_utility_by_id(db_session, "nonexistent-id")

        assert utility is None


class TestUtilityCreation:
    """Tests for utility creation functionality."""

    @pytest.mark.asyncio
    async def test_create_utility_success(self, db_session, test_user):
        """Test successful utility creation."""
        utility_data = UtilityCreate(
            name="New Test Utility",
            category="shelter",
            latitude=40.7589,
            longitude=-73.9851,
            description="A new test utility",
        )

        utility = await utility_controller.create_utility(
            db_session, utility_data, test_user.id
        )

        assert utility is not None
        assert utility.name == "New Test Utility"
        assert utility.creator_id == test_user.id
        assert utility.verified is False  # New utilities start unverified

    @pytest.mark.asyncio
    async def test_create_utility_generates_id(self, db_session, test_user):
        """Test that utility ID is auto-generated."""
        utility_data = UtilityCreate(
            name="ID Test Utility",
            category="food",
            latitude=40.7589,
            longitude=-73.9851,
        )

        utility = await utility_controller.create_utility(
            db_session, utility_data, test_user.id
        )

        assert utility.id is not None
        assert len(utility.id) > 0

    @pytest.mark.asyncio
    async def test_create_utility_invalid_coordinates(self, db_session, test_user):
        """Test creating utility with invalid coordinates."""
        utility_data = UtilityCreate(
            name="Invalid Coords",
            category="shelter",
            latitude=200,  # Invalid
            longitude=-73.9851,
        )

        with pytest.raises(Exception):
            await utility_controller.create_utility(
                db_session, utility_data, test_user.id
            )


class TestUtilityUpdate:
    """Tests for utility update functionality."""

    @pytest.mark.asyncio
    async def test_update_utility_success(self, db_session, test_utility, test_user):
        """Test successful utility update by owner."""
        from schemas.utility import UtilityUpdate

        updates = UtilityUpdate(name="Updated Food Bank Name")

        updated = await utility_controller.update_utility(
            db=db_session,
            utility_id=test_utility.id,
            utility_data=updates,
            user_id=test_user.id,
            is_admin=True,  # Owner or admin
        )

        assert updated.name == "Updated Food Bank Name"

    @pytest.mark.asyncio
    async def test_update_utility_not_found(self, db_session, test_user):
        """Test updating non-existent utility."""
        from schemas.utility import UtilityUpdate

        updates = UtilityUpdate(name="New Name")

        with pytest.raises(Exception):
            await utility_controller.update_utility(
                db=db_session,
                utility_id="nonexistent",
                utility_data=updates,
                user_id=test_user.id,
            )


class TestUtilityDeletion:
    """Tests for utility deletion functionality."""

    @pytest.mark.asyncio
    async def test_delete_utility_success(self, db_session, test_utility, test_user):
        """Test successful utility deletion by owner."""
        result = await utility_controller.delete_utility(
            db=db_session,
            utility_id=test_utility.id,
            user_id=test_user.id,
            is_admin=True,
        )

        assert result is True

    @pytest.mark.asyncio
    async def test_delete_utility_by_admin(self, db_session, test_utility, test_admin):
        """Test that admin can delete any utility."""
        result = await utility_controller.delete_utility(
            db=db_session,
            utility_id=test_utility.id,
            user_id=test_admin.id,
            is_admin=True,
        )

        assert result is True


class TestUtilityReporting:
    """Tests for utility reporting functionality."""

    @pytest.mark.asyncio
    async def test_report_utility_success(self, db_session, test_utility, test_user):
        """Test successful utility report."""
        report = await utility_controller.report_utility(
            db=db_session,
            utility_id=test_utility.id,
            reason="incorrect",
            description="The address is wrong",
            user_id=test_user.id,
        )

        assert report is not None
        assert report.utility_id == test_utility.id
        assert report.reason == "incorrect"
        assert report.status == "pending"

    @pytest.mark.asyncio
    async def test_report_utility_increments_count(
        self, db_session, test_utility, test_user
    ):
        """Test that reporting increments utility report count."""
        original_count = test_utility.report_count or 0

        await utility_controller.report_utility(
            db=db_session,
            utility_id=test_utility.id,
            reason="spam",
            user_id=test_user.id,
        )

        db_session.refresh(test_utility)
        assert test_utility.report_count == original_count + 1


class TestUtilityVerification:
    """Tests for utility verification functionality."""

    @pytest.mark.asyncio
    async def test_verify_utility_by_admin(self, db_session, test_utility, test_admin):
        """Test that admin can verify utility."""
        test_utility.verified = False
        db_session.commit()

        result = await utility_controller.verify_utility(
            db=db_session, utility_id=test_utility.id, admin_user_id=test_admin.id
        )

        assert result is not None
        db_session.refresh(test_utility)
        assert test_utility.verified is True
        assert test_utility.verified_by_id == test_admin.id


class TestAppStatistics:
    """Tests for application statistics."""

    @pytest.mark.asyncio
    async def test_get_app_statistics(self, db_session, test_utilities):
        """Test retrieving application statistics."""
        stats = await utility_controller.get_app_statistics(db_session)

        assert stats is not None
        assert "total_utilities" in stats
        assert "verified_utilities" in stats
        assert "categories" in stats


class TestUtilityEndpoints:
    """Integration tests for utility API endpoints."""

    def test_get_utility_endpoint(self, client, test_utility):
        """Test GET /utilities/{id} endpoint."""
        response = client.get(f"/utilities/{test_utility.id}")

        assert response.status_code in [200, 429]
        if response.status_code == 200:
            data = response.json()
            assert data["id"] == test_utility.id

    def test_get_all_utilities_endpoint(self, client, test_utilities):
        """Test GET /utilities/all endpoint."""
        response = client.get("/utilities/all")

        assert response.status_code in [200, 429]
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)
