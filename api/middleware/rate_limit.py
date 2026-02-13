"""
Rate Limiting Middleware

Provides protection against:
- Brute force login attacks
- API abuse
- DDoS mitigation

Supports both in-memory (development) and Redis (production) backends.
Auto-selects Redis when REDIS_URL env var is set.
"""

import os
import time
import logging
from collections import defaultdict
from typing import Optional, Dict, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

logger = logging.getLogger(__name__)


class InMemoryRateLimiter:
    """
    Simple in-memory rate limiter using sliding window algorithm.

    Note: This is suitable for single-instance deployments.
    For multi-instance production, use Redis backend.
    """

    def __init__(self):
        self._requests: Dict[str, list] = defaultdict(list)
        self._cleanup_interval = 60
        self._last_cleanup = time.time()

    def _cleanup_old_entries(self, window_seconds: int):
        """Remove entries older than the window."""
        now = time.time()
        if now - self._last_cleanup < self._cleanup_interval:
            return

        cutoff = now - window_seconds
        for key in list(self._requests.keys()):
            self._requests[key] = [
                (ts, count) for ts, count in self._requests[key]
                if ts > cutoff
            ]
            if not self._requests[key]:
                del self._requests[key]

        self._last_cleanup = now

    def is_rate_limited(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> Tuple[bool, int, int]:
        """
        Check if a request should be rate limited.

        Returns:
            Tuple of (is_limited, remaining_requests, reset_time)
        """
        self._cleanup_old_entries(window_seconds)

        now = time.time()
        cutoff = now - window_seconds

        entries = self._requests[key]
        valid_entries = [(ts, count) for ts, count in entries if ts > cutoff]
        total_requests = sum(count for _, count in valid_entries)

        if total_requests >= max_requests:
            if valid_entries:
                oldest_ts = min(ts for ts, _ in valid_entries)
                reset_time = int(oldest_ts + window_seconds - now)
            else:
                reset_time = window_seconds
            return True, 0, reset_time

        self._requests[key].append((now, 1))
        remaining = max_requests - total_requests - 1
        return False, remaining, window_seconds


class RedisRateLimiter:
    """
    Redis-based rate limiter using sliding window algorithm.
    Shared across Gunicorn workers for accurate distributed rate limiting.
    """

    def __init__(self, redis_url: str = None):
        import redis
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = redis.from_url(self.redis_url, decode_responses=True)

    def is_rate_limited(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> Tuple[bool, int, int]:
        """
        Check rate limit using Redis sorted set for sliding window.
        Each request is stored as a member with its timestamp as the score.
        """
        redis_key = f"rate_limit:{key}"
        now = time.time()
        window_start = now - window_seconds

        pipe = self.redis.pipeline()
        pipe.zremrangebyscore(redis_key, 0, window_start)
        pipe.zadd(redis_key, {f"{now}": now})
        pipe.zcard(redis_key)
        pipe.expire(redis_key, window_seconds)
        results = pipe.execute()

        current_requests = results[2]

        if current_requests > max_requests:
            return True, 0, window_seconds

        remaining = max_requests - current_requests
        return False, remaining, window_seconds


def _create_limiter():
    """Auto-select rate limiter backend based on REDIS_URL availability."""
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        try:
            limiter = RedisRateLimiter(redis_url)
            limiter.redis.ping()
            logger.info("Rate limiter: Redis backend (%s)", redis_url.split("@")[-1])
            return limiter
        except Exception as e:
            logger.warning("Redis unavailable for rate limiting, falling back to in-memory: %s", e)
    logger.info("Rate limiter: in-memory backend")
    return InMemoryRateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware with configurable limits per endpoint type.

    Limits:
    - Login attempts: 5 per minute (brute force protection)
    - Authenticated users: 100 per minute
    - Anonymous users: 20 per minute
    - Write operations: 10 per minute
    """

    def __init__(
        self,
        app,
        default_limit: int = 100,
        default_window: int = 60,
        login_limit: int = 5,
        anonymous_limit: int = 20,
        write_limit: int = 10,
        enabled: bool = True
    ):
        super().__init__(app)

        self.limiter = _create_limiter()
        self.enabled = enabled

        self.default_limit = int(os.getenv("RATE_LIMIT_DEFAULT", default_limit))
        self.default_window = int(os.getenv("RATE_LIMIT_WINDOW", default_window))
        self.login_limit = int(os.getenv("RATE_LIMIT_LOGIN", login_limit))
        self.anonymous_limit = int(os.getenv("RATE_LIMIT_ANONYMOUS", anonymous_limit))
        self.write_limit = int(os.getenv("RATE_LIMIT_WRITE", write_limit))

        self.exempt_paths = {"/health", "/docs", "/openapi.json", "/redoc"}

    def _get_client_identifier(self, request: Request) -> str:
        """Get unique identifier for the client."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
        return client_ip

    def _get_rate_limit_params(
        self,
        request: Request,
        client_id: str
    ) -> Tuple[str, int, int]:
        """Determine rate limit parameters based on request context."""
        path = request.url.path.lower()
        method = request.method.upper()

        if "/auth/login" in path:
            return f"login:{client_id}", self.login_limit, 60

        auth_header = request.headers.get("Authorization", "")
        is_authenticated = auth_header.startswith("Bearer ")

        if method in ("POST", "PUT", "DELETE", "PATCH"):
            limit = self.write_limit if not is_authenticated else self.default_limit
            return f"write:{client_id}", limit, self.default_window

        if is_authenticated:
            return f"auth:{client_id}", self.default_limit, self.default_window
        else:
            return f"anon:{client_id}", self.anonymous_limit, self.default_window

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request with rate limiting."""
        if not self.enabled or request.url.path in self.exempt_paths:
            return await call_next(request)

        client_id = self._get_client_identifier(request)
        rate_key, max_requests, window = self._get_rate_limit_params(request, client_id)

        is_limited, remaining, reset_time = self.limiter.is_rate_limited(
            rate_key, max_requests, window
        )

        if is_limited:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please try again later.",
                    "retry_after": reset_time
                },
                headers={
                    "Retry-After": str(reset_time),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + reset_time)
                }
            )

        response = await call_next(request)

        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + window)

        return response
