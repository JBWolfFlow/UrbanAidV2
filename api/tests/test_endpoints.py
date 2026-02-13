"""
API Endpoint Integration Tests

End-to-end tests for all API endpoints including:
- Health checks
- Authentication endpoints
- User endpoints
- Utility endpoints
- Admin endpoints
"""

import pytest
from datetime import datetime


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    def test_health_endpoint(self, client):
        """Test GET /health returns 200."""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_health_includes_database_status(self, client):
        """Test that health check includes database status."""
        response = client.get("/health")

        data = response.json()
        assert "database" in data or "db" in data.get("checks", {})

    def test_ready_endpoint(self, client):
        """Test GET /ready endpoint for k8s readiness probes."""
        response = client.get("/ready")

        assert response.status_code == 200


class TestAuthEndpoints:
    """Tests for authentication endpoints."""

    def test_register_endpoint(self, client):
        """Test POST /auth/register creates new user."""
        response = client.post(
            "/auth/register",
            json={
                "username": "integrationtest",
                "email": "integration@test.com",
                "password": "SecurePassword123!"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "integrationtest"
        assert "password" not in data

    def test_login_endpoint(self, client, test_user):
        """Test POST /auth/login returns tokens."""
        response = client.post(
            "/auth/login",
            json={
                "username": "testuser",
                "password": "TestPassword123!"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_refresh_token_endpoint(self, client, test_user):
        """Test POST /auth/refresh returns new access token."""
        # First login
        login_response = client.post(
            "/auth/login",
            json={
                "username": "testuser",
                "password": "TestPassword123!"
            }
        )
        tokens = login_response.json()

        # Refresh
        response = client.post(
            "/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    def test_logout_endpoint(self, client, auth_headers):
        """Test POST /auth/logout invalidates token."""
        response = client.post("/auth/logout", headers=auth_headers)

        assert response.status_code == 200


class TestUserEndpoints:
    """Tests for user endpoints."""

    def test_get_current_user(self, client, auth_headers, test_user):
        """Test GET /users/me returns current user."""
        response = client.get("/users/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email

    def test_update_current_user(self, client, auth_headers):
        """Test PATCH /users/me updates user profile."""
        response = client.patch(
            "/users/me",
            headers=auth_headers,
            json={"full_name": "Test User Name"}
        )

        assert response.status_code == 200

    def test_change_password_endpoint(self, client, auth_headers):
        """Test POST /users/me/change-password."""
        response = client.post(
            "/users/me/change-password",
            headers=auth_headers,
            json={
                "old_password": "TestPassword123!",
                "new_password": "NewSecure456!"
            }
        )

        assert response.status_code == 200

    def test_delete_account(self, client, auth_headers):
        """Test DELETE /users/me deactivates account."""
        response = client.delete("/users/me", headers=auth_headers)

        assert response.status_code in [200, 204]


class TestUtilityEndpoints:
    """Tests for utility endpoints."""

    def test_list_utilities(self, client, test_utilities):
        """Test GET /utilities returns list."""
        response = client.get("/utilities")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_list_utilities_with_pagination(self, client, test_utilities):
        """Test pagination parameters."""
        response = client.get("/utilities", params={"limit": 5, "offset": 0})

        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5

    def test_get_nearby_utilities(self, client, test_utilities):
        """Test GET /utilities/nearby with geo params."""
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

    def test_search_utilities(self, client, test_utility):
        """Test GET /utilities/search with query."""
        response = client.get(
            "/utilities/search",
            params={"q": "Food"}
        )

        assert response.status_code == 200

    def test_get_utility_by_id(self, client, test_utility):
        """Test GET /utilities/{id}."""
        response = client.get(f"/utilities/{test_utility.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_utility.id

    def test_get_utility_not_found(self, client):
        """Test GET /utilities/{id} with non-existent ID."""
        response = client.get("/utilities/nonexistent-id-12345")

        assert response.status_code == 404

    def test_create_utility(self, client, auth_headers):
        """Test POST /utilities creates new utility."""
        response = client.post(
            "/utilities",
            headers=auth_headers,
            json={
                "name": "Integration Test Utility",
                "category": "shelter",
                "latitude": 40.7589,
                "longitude": -73.9851,
                "address": "123 Test Ave",
                "city": "Test City",
                "state": "TS",
                "zip_code": "12345"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Integration Test Utility"

    def test_update_utility(self, client, auth_headers, test_utility):
        """Test PATCH /utilities/{id}."""
        response = client.patch(
            f"/utilities/{test_utility.id}",
            headers=auth_headers,
            json={"name": "Updated Name"}
        )

        assert response.status_code == 200

    def test_delete_utility(self, client, auth_headers, test_utility):
        """Test DELETE /utilities/{id}."""
        response = client.delete(
            f"/utilities/{test_utility.id}",
            headers=auth_headers
        )

        assert response.status_code in [200, 204]

    def test_report_utility(self, client, auth_headers, test_utility):
        """Test POST /utilities/{id}/report."""
        response = client.post(
            f"/utilities/{test_utility.id}/report",
            headers=auth_headers,
            json={
                "reason": "incorrect_info",
                "description": "Wrong address"
            }
        )

        assert response.status_code in [200, 201]

    def test_get_utility_categories(self, client):
        """Test GET /utilities/categories."""
        response = client.get("/utilities/categories")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestRatingEndpoints:
    """Tests for rating endpoints."""

    def test_get_utility_ratings(self, client, test_utility, test_rating):
        """Test GET /utilities/{id}/ratings."""
        response = client.get(f"/utilities/{test_utility.id}/ratings")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_rating(self, client, auth_headers, test_utility):
        """Test POST /utilities/{id}/ratings."""
        response = client.post(
            f"/utilities/{test_utility.id}/ratings",
            headers=auth_headers,
            json={"score": 4, "comment": "Good service"}
        )

        assert response.status_code == 201

    def test_create_rating_validation(self, client, auth_headers, test_utility):
        """Test rating validation rules."""
        # Invalid score
        response = client.post(
            f"/utilities/{test_utility.id}/ratings",
            headers=auth_headers,
            json={"score": 10}  # Should be 1-5
        )

        assert response.status_code == 422


class TestAdminEndpoints:
    """Tests for admin-only endpoints."""

    def test_admin_list_users(self, client, admin_headers):
        """Test GET /admin/users (admin only)."""
        response = client.get("/admin/users", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_admin_list_users_forbidden(self, client, auth_headers):
        """Test non-admin cannot access admin endpoints."""
        response = client.get("/admin/users", headers=auth_headers)

        assert response.status_code == 403

    def test_admin_verify_utility(self, client, admin_headers, test_utility):
        """Test POST /admin/utilities/{id}/verify."""
        response = client.post(
            f"/admin/utilities/{test_utility.id}/verify",
            headers=admin_headers
        )

        assert response.status_code == 200

    def test_admin_get_pending_reports(self, client, admin_headers):
        """Test GET /admin/reports/pending."""
        response = client.get("/admin/reports/pending", headers=admin_headers)

        assert response.status_code == 200

    def test_admin_review_report(self, client, admin_headers, db_session, test_utility, test_user):
        """Test POST /admin/reports/{id}/review."""
        from models import UtilityReport

        # Create a report to review
        report = UtilityReport(
            utility_id=test_utility.id,
            user_id=test_user.id,
            reason="spam",
            status="pending",
            created_at=datetime.utcnow()
        )
        db_session.add(report)
        db_session.commit()

        response = client.post(
            f"/admin/reports/{report.id}/review",
            headers=admin_headers,
            json={"action": "dismiss"}
        )

        assert response.status_code == 200

    def test_admin_get_statistics(self, client, admin_headers):
        """Test GET /admin/statistics."""
        response = client.get("/admin/statistics", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_utilities" in data


class TestExternalDataEndpoints:
    """Tests for external data source endpoints."""

    def test_get_hrsa_health_centers(self, client):
        """Test GET /external/hrsa/health-centers."""
        response = client.get(
            "/external/hrsa/health-centers",
            params={
                "latitude": 40.7128,
                "longitude": -74.0060,
                "radius": 25
            }
        )

        # May be 200 or 503 depending on external service
        assert response.status_code in [200, 503]

    def test_get_va_facilities(self, client):
        """Test GET /external/va/facilities."""
        response = client.get(
            "/external/va/facilities",
            params={
                "latitude": 40.7128,
                "longitude": -74.0060,
                "radius": 25
            }
        )

        assert response.status_code in [200, 503]

    def test_get_usda_snap_retailers(self, client):
        """Test GET /external/usda/snap-retailers."""
        response = client.get(
            "/external/usda/snap-retailers",
            params={
                "latitude": 40.7128,
                "longitude": -74.0060,
                "radius": 10
            }
        )

        assert response.status_code in [200, 503]


class TestErrorHandling:
    """Tests for error handling."""

    def test_404_not_found(self, client):
        """Test 404 response for non-existent route."""
        response = client.get("/nonexistent/route")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data

    def test_422_validation_error(self, client, auth_headers):
        """Test 422 response for validation errors."""
        response = client.post(
            "/utilities",
            headers=auth_headers,
            json={"name": ""}  # Missing required fields
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_401_unauthorized(self, client):
        """Test 401 response for unauthenticated requests."""
        response = client.get("/users/me")

        assert response.status_code == 401

    def test_403_forbidden(self, client, auth_headers):
        """Test 403 response for insufficient permissions."""
        response = client.get("/admin/users", headers=auth_headers)

        assert response.status_code == 403


class TestResponseFormat:
    """Tests for API response format consistency."""

    def test_list_response_format(self, client, test_utilities):
        """Test that list responses have consistent format."""
        response = client.get("/utilities")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_single_resource_format(self, client, test_utility):
        """Test that single resource responses have consistent format."""
        response = client.get(f"/utilities/{test_utility.id}")

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data

    def test_error_response_format(self, client):
        """Test that error responses have consistent format."""
        response = client.get("/utilities/nonexistent")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data

    def test_created_response_includes_resource(self, client, auth_headers):
        """Test that POST responses include created resource."""
        response = client.post(
            "/utilities",
            headers=auth_headers,
            json={
                "name": "Format Test",
                "category": "shelter",
                "latitude": 40.7589,
                "longitude": -73.9851,
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["name"] == "Format Test"
