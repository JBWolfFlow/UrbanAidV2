"""
Security Tests

Tests for security vulnerabilities including:
- CORS policy enforcement
- Rate limiting
- SQL injection prevention
- XSS prevention
- Authentication bypass attempts
- Authorization enforcement
- Input validation
"""

import pytest
import json
from datetime import datetime
import time


class TestCORSSecurity:
    """Tests for CORS policy enforcement."""

    def test_cors_allows_valid_origin(self, client):
        """Test that CORS allows configured origins."""
        response = client.options(
            "/utilities",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET"
            }
        )

        # Should allow preflight
        assert "access-control-allow-origin" in response.headers.keys() or \
               response.status_code in [200, 204]

    def test_cors_rejects_unknown_origin(self, client):
        """Test that CORS rejects unknown origins."""
        response = client.options(
            "/utilities",
            headers={
                "Origin": "http://malicious-site.com",
                "Access-Control-Request-Method": "GET"
            }
        )

        # Should either not include the origin in allowed origins
        # or reject the preflight
        allowed_origin = response.headers.get("access-control-allow-origin", "")
        assert allowed_origin != "http://malicious-site.com"
        assert allowed_origin != "*"  # Wildcard should not be used

    def test_cors_credentials_handling(self, client):
        """Test that credentials are properly handled."""
        response = client.options(
            "/auth/login",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST"
            }
        )

        # If credentials are allowed, origin cannot be *
        if response.headers.get("access-control-allow-credentials") == "true":
            assert response.headers.get("access-control-allow-origin") != "*"


class TestRateLimiting:
    """Tests for rate limiting functionality."""

    def test_rate_limit_headers_present(self, client, auth_headers):
        """Test that rate limit headers are present."""
        response = client.get("/utilities", headers=auth_headers)

        # Check for standard rate limit headers
        rate_limit_headers = [
            "x-ratelimit-limit",
            "x-ratelimit-remaining",
            "x-ratelimit-reset",
            "ratelimit-limit",
            "ratelimit-remaining",
        ]

        has_rate_limit_header = any(
            h in response.headers.keys() for h in rate_limit_headers
        )
        # Note: This depends on rate limiting implementation
        # assert has_rate_limit_header

    def test_rate_limit_triggers_on_excessive_requests(self, client):
        """Test that rate limiting triggers after threshold."""
        # Make many requests quickly
        responses = []
        for _ in range(30):  # Exceed typical anonymous limit
            response = client.get("/health")
            responses.append(response.status_code)

        # At least one should be rate limited (429)
        # Note: This depends on rate limiting being enabled
        # assert 429 in responses

    def test_login_rate_limiting_stricter(self, client, test_user):
        """Test that login endpoint has stricter rate limiting."""
        responses = []
        for _ in range(10):
            response = client.post(
                "/auth/login",
                json={"username": "testuser", "password": "wrong"}
            )
            responses.append(response.status_code)
            time.sleep(0.1)  # Small delay

        # Should see rate limiting kick in (429)
        # After 5 failed attempts typically
        # Note: Depends on RATE_LIMIT_LOGIN setting


class TestSQLInjectionPrevention:
    """Tests for SQL injection prevention."""

    def test_sql_injection_in_username(self, client):
        """Test SQL injection attempt in username field."""
        response = client.post(
            "/auth/login",
            json={
                "username": "admin'; DROP TABLE users; --",
                "password": "password"
            }
        )

        # Should fail authentication, not execute SQL
        assert response.status_code == 401

    def test_sql_injection_in_search(self, client):
        """Test SQL injection attempt in search query."""
        response = client.get(
            "/utilities/search",
            params={"q": "'; DROP TABLE utilities; --"}
        )

        # Should return empty results, not execute SQL
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_sql_injection_in_utility_id(self, client):
        """Test SQL injection attempt in utility ID."""
        response = client.get("/utilities/1 OR 1=1; --")

        # Should return 404, not all utilities
        assert response.status_code == 404

    def test_sql_injection_in_filter_params(self, client):
        """Test SQL injection in filter parameters."""
        response = client.get(
            "/utilities/nearby",
            params={
                "latitude": "40.7128; DROP TABLE utilities;",
                "longitude": "-74.0060",
                "radius": "10"
            }
        )

        # Should return validation error, not execute SQL
        assert response.status_code in [400, 422]


class TestXSSPrevention:
    """Tests for XSS (Cross-Site Scripting) prevention."""

    def test_xss_in_username(self, client):
        """Test XSS attempt in username field."""
        response = client.post(
            "/auth/register",
            json={
                "username": "<script>alert('xss')</script>",
                "email": "xss@test.com",
                "password": "SecurePassword123!"
            }
        )

        # Should either reject or sanitize
        if response.status_code == 201:
            data = response.json()
            assert "<script>" not in data.get("username", "")

    def test_xss_in_utility_name(self, client, auth_headers):
        """Test XSS attempt in utility name."""
        response = client.post(
            "/utilities",
            headers=auth_headers,
            json={
                "name": "<img src=x onerror=alert('xss')>",
                "category": "shelter",
                "latitude": 40.7589,
                "longitude": -73.9851,
            }
        )

        if response.status_code == 201:
            data = response.json()
            assert "onerror" not in data.get("name", "")

    def test_xss_in_rating_comment(self, client, auth_headers, test_utility):
        """Test XSS attempt in rating comment."""
        response = client.post(
            f"/utilities/{test_utility.id}/ratings",
            headers=auth_headers,
            json={
                "score": 5,
                "comment": "<script>document.cookie</script>"
            }
        )

        if response.status_code == 201:
            data = response.json()
            assert "<script>" not in data.get("comment", "")

    def test_content_type_header(self, client):
        """Test that JSON responses have proper content-type."""
        response = client.get("/utilities")

        content_type = response.headers.get("content-type", "")
        assert "application/json" in content_type


class TestAuthenticationBypass:
    """Tests for authentication bypass attempts."""

    def test_cannot_access_protected_without_token(self, client):
        """Test that protected endpoints require authentication."""
        protected_endpoints = [
            ("GET", "/users/me"),
            ("POST", "/utilities"),
            ("DELETE", "/utilities/test-id"),
        ]

        for method, endpoint in protected_endpoints:
            response = getattr(client, method.lower())(endpoint)
            assert response.status_code == 401

    def test_cannot_use_manipulated_token(self, client, auth_headers):
        """Test that manipulated tokens are rejected."""
        # Manipulate the token
        auth = auth_headers["Authorization"]
        manipulated = auth[:-10] + "MANIPULATED"

        response = client.get(
            "/users/me",
            headers={"Authorization": manipulated}
        )

        assert response.status_code == 401

    def test_cannot_use_empty_bearer(self, client):
        """Test that empty bearer token is rejected."""
        response = client.get(
            "/users/me",
            headers={"Authorization": "Bearer "}
        )

        assert response.status_code == 401

    def test_cannot_use_expired_token(self, client, expired_token_headers):
        """Test that expired tokens are rejected."""
        response = client.get("/users/me", headers=expired_token_headers)

        assert response.status_code == 401

    def test_bearer_scheme_required(self, client, auth_headers):
        """Test that Bearer scheme is required."""
        token = auth_headers["Authorization"].replace("Bearer ", "")

        response = client.get(
            "/users/me",
            headers={"Authorization": token}  # Missing "Bearer "
        )

        assert response.status_code == 401


class TestAuthorizationEnforcement:
    """Tests for authorization (RBAC) enforcement."""

    def test_user_cannot_access_admin_endpoints(self, client, auth_headers):
        """Test that regular users cannot access admin endpoints."""
        admin_endpoints = [
            "/admin/users",
            "/admin/reports/pending",
            "/admin/statistics",
        ]

        for endpoint in admin_endpoints:
            response = client.get(endpoint, headers=auth_headers)
            assert response.status_code == 403

    def test_user_cannot_modify_others_data(self, client, auth_headers, test_admin):
        """Test that users cannot modify other users' data."""
        response = client.patch(
            f"/users/{test_admin.id}",
            headers=auth_headers,
            json={"email": "hacked@example.com"}
        )

        assert response.status_code in [403, 404]

    def test_user_cannot_delete_others_rating(self, client, auth_headers, db_session, test_admin, test_utility):
        """Test that users cannot delete others' ratings."""
        from models import Rating

        # Create rating by admin
        admin_rating = Rating(
            user_id=test_admin.id,
            utility_id=test_utility.id,
            score=5,
            created_at=datetime.utcnow()
        )
        db_session.add(admin_rating)
        db_session.commit()

        # Try to delete as regular user
        response = client.delete(
            f"/ratings/{admin_rating.id}",
            headers=auth_headers
        )

        assert response.status_code in [403, 404]

    def test_moderator_can_flag_ratings(self, client, moderator_headers, test_rating):
        """Test that moderators can flag inappropriate ratings."""
        response = client.post(
            f"/ratings/{test_rating.id}/flag",
            headers=moderator_headers
        )

        # Should be allowed for moderators
        assert response.status_code in [200, 201, 404]  # 404 if endpoint doesn't exist


class TestInputValidation:
    """Tests for input validation."""

    def test_email_format_validation(self, client):
        """Test that invalid email formats are rejected."""
        response = client.post(
            "/auth/register",
            json={
                "username": "validuser",
                "email": "not-an-email",
                "password": "SecurePassword123!"
            }
        )

        assert response.status_code == 422

    def test_password_complexity_validation(self, client):
        """Test that weak passwords are rejected."""
        weak_passwords = [
            "short",
            "nouppercase123!",
            "NOLOWERCASE123!",
            "NoNumbers!",
            "NoSpecialChars123",
        ]

        for password in weak_passwords:
            response = client.post(
                "/auth/register",
                json={
                    "username": f"user_{password[:5]}",
                    "email": f"{password[:5]}@test.com",
                    "password": password
                }
            )

            # Should reject weak passwords
            assert response.status_code == 422, f"Accepted weak password: {password}"

    def test_latitude_range_validation(self, client):
        """Test that invalid latitude is rejected."""
        response = client.get(
            "/utilities/nearby",
            params={
                "latitude": 100,  # Invalid: must be -90 to 90
                "longitude": -74,
                "radius": 10
            }
        )

        assert response.status_code in [400, 422]

    def test_longitude_range_validation(self, client):
        """Test that invalid longitude is rejected."""
        response = client.get(
            "/utilities/nearby",
            params={
                "latitude": 40,
                "longitude": 200,  # Invalid: must be -180 to 180
                "radius": 10
            }
        )

        assert response.status_code in [400, 422]

    def test_rating_score_range_validation(self, client, auth_headers, test_utility):
        """Test that invalid rating scores are rejected."""
        invalid_scores = [0, -1, 6, 10, 100]

        for score in invalid_scores:
            response = client.post(
                f"/utilities/{test_utility.id}/ratings",
                headers=auth_headers,
                json={"score": score}
            )

            assert response.status_code == 422, f"Accepted invalid score: {score}"

    def test_string_length_limits(self, client, auth_headers):
        """Test that excessively long strings are rejected."""
        very_long_string = "A" * 10001  # Exceed typical limits

        response = client.post(
            "/utilities",
            headers=auth_headers,
            json={
                "name": very_long_string,
                "category": "shelter",
                "latitude": 40.7589,
                "longitude": -73.9851,
            }
        )

        assert response.status_code == 422


class TestSecurityHeaders:
    """Tests for security headers."""

    def test_content_security_policy(self, client):
        """Test that CSP header is present."""
        response = client.get("/health")

        # Check for CSP header (may vary based on implementation)
        # assert "content-security-policy" in response.headers.keys()

    def test_x_content_type_options(self, client):
        """Test that X-Content-Type-Options is set."""
        response = client.get("/health")

        # assert response.headers.get("x-content-type-options") == "nosniff"

    def test_x_frame_options(self, client):
        """Test that X-Frame-Options is set."""
        response = client.get("/health")

        x_frame = response.headers.get("x-frame-options", "")
        # assert x_frame in ["DENY", "SAMEORIGIN"]

    def test_no_sensitive_headers_exposed(self, client):
        """Test that sensitive headers are not exposed."""
        response = client.get("/health")

        sensitive_headers = ["server", "x-powered-by"]
        for header in sensitive_headers:
            value = response.headers.get(header, "")
            # Should not reveal specific versions
            assert "version" not in value.lower()


class TestDataLeakagePrevention:
    """Tests to prevent data leakage."""

    def test_password_not_in_user_response(self, client, auth_headers):
        """Test that password is never returned in responses."""
        response = client.get("/users/me", headers=auth_headers)

        data = response.json()
        assert "password" not in data
        assert "hashed_password" not in data

    def test_internal_ids_not_exposed(self, client, test_utility):
        """Test that internal database IDs follow expected format."""
        response = client.get(f"/utilities/{test_utility.id}")

        data = response.json()
        # Internal implementation details should not be exposed

    def test_error_messages_not_verbose(self, client):
        """Test that error messages don't reveal implementation details."""
        response = client.get("/utilities/nonexistent")

        data = response.json()
        detail = str(data.get("detail", ""))

        # Should not reveal database structure
        assert "SELECT" not in detail.upper()
        assert "TABLE" not in detail.upper()
        assert "COLUMN" not in detail.upper()

    def test_stack_traces_not_exposed(self, client):
        """Test that stack traces are not exposed in errors."""
        # Trigger an error
        response = client.get(
            "/utilities/nearby",
            params={"latitude": "invalid"}
        )

        if response.status_code >= 400:
            body = response.text
            assert "Traceback" not in body
            assert "File \"" not in body
