"""
Security Headers Middleware

Adds security headers to all responses following OWASP recommendations:
- X-Content-Type-Options: Prevents MIME-type sniffing
- X-Frame-Options: Prevents clickjacking
- X-XSS-Protection: Legacy XSS protection
- Strict-Transport-Security: Enforces HTTPS
- Content-Security-Policy: Restricts resource loading
- Referrer-Policy: Controls referrer information
- Permissions-Policy: Restricts browser features
"""

import os
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers to all HTTP responses.

    Headers added:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - X-XSS-Protection: 1; mode=block
    - Strict-Transport-Security (HSTS) - only in production
    - Content-Security-Policy
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy
    """

    def __init__(self, app, enable_hsts: bool = None):
        """
        Initialize the middleware.

        Args:
            app: The ASGI application
            enable_hsts: Whether to enable HSTS. If None, determined by environment.
        """
        super().__init__(app)

        # Determine if we should enable HSTS (only in production with HTTPS)
        if enable_hsts is None:
            env = os.getenv("ENVIRONMENT", "development")
            self.enable_hsts = env.lower() in ("production", "prod", "staging")
        else:
            self.enable_hsts = enable_hsts

        # HSTS max-age: 1 year (recommended minimum)
        self.hsts_max_age = int(os.getenv("HSTS_MAX_AGE", "31536000"))

    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Process the request and add security headers to response.
        """
        response = await call_next(request)

        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking - frame embedding
        response.headers["X-Frame-Options"] = "DENY"

        # Legacy XSS protection (for older browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Strict Transport Security (HTTPS enforcement)
        if self.enable_hsts:
            response.headers["Strict-Transport-Security"] = (
                f"max-age={self.hsts_max_age}; includeSubDomains; preload"
            )

        # Content Security Policy
        # Adjust these directives based on your application's needs
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",  # Adjust if you need external scripts
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' https:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)

        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions Policy (formerly Feature-Policy)
        permissions = [
            "geolocation=(self)",  # Allow geolocation for utility discovery
            "camera=()",  # Disable camera
            "microphone=()",  # Disable microphone
            "payment=()",  # Disable payment APIs
            "usb=()"  # Disable USB
        ]
        response.headers["Permissions-Policy"] = ", ".join(permissions)

        # Prevent caching of sensitive data
        if request.url.path.startswith("/auth") or request.url.path.startswith("/admin"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"

        return response


def get_cors_origins() -> list:
    """
    Get allowed CORS origins from environment variable.

    Returns:
        List of allowed origin URLs
    """
    origins_str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:8081,http://localhost:19006"
    )
    return [origin.strip() for origin in origins_str.split(",") if origin.strip()]
