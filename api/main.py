"""
UrbanAid API - FastAPI backend for public utility discovery
Provides endpoints for finding, adding, and managing public utilities

Security Features:
- JWT-based authentication with refresh tokens
- CORS whitelist (no wildcard origins)
- Security headers (CSP, HSTS, X-Frame-Options)
- Rate limiting protection
- Credentials in request body (not query params)
"""
import os
import logging
import time as _time
import httpx as _httpx

from utils.logging_config import setup_logging
setup_logging()

logger = logging.getLogger(__name__)
from fastapi import FastAPI, HTTPException, Depends, Query, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
from contextlib import asynccontextmanager

from models.database import get_db, init_db
from models.utility import Utility as UtilityModel
from models.user import User as UserModel
from models.rating import Rating as RatingModel
from schemas.utility import (
    UtilityCreate,
    UtilityResponse,
    UtilityUpdate,
    UtilityFilter
)
from schemas.user import (
    UserCreate, UserResponse, UserLogin, TokenResponse,
    PasswordChange, RefreshTokenRequest, MessageResponse
)
from schemas.rating import RatingCreate, RatingResponse
from controllers.utility_controller import utility_controller
from controllers.user_controller import user_controller
from controllers.rating_controller import rating_controller
from services.location_service import LocationService
from services.notification_service import NotificationService
from services.hrsa_service import HRSAService
from services.va_service import VAService
from services.usda_service import USDAService
from utils.auth import (
    get_current_user, get_current_user_optional,
    get_current_active_user, require_admin, require_moderator,
    TokenData, decode_token
)
from utils.exceptions import (
    UtilityNotFoundError, UnauthorizedError, UserAlreadyExistsError,
    InvalidCredentialsError, InactiveUserError, UserNotFoundError,
    UrbanAidException
)
from middleware.security import SecurityHeadersMiddleware, get_cors_origins
from middleware.rate_limit import RateLimitMiddleware

# Security
security = HTTPBearer(auto_error=False)

# Environment configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    init_db()
    # Log utility count on startup for visibility
    from models.database import SessionLocal
    db = SessionLocal()
    try:
        count = db.query(UtilityModel).count()
    finally:
        db.close()
    logger.info("UrbanAid API started (env=%s, utilities=%d)", ENVIRONMENT, count)
    yield
    logger.info("UrbanAid API shutting down")


# Initialize FastAPI app
app = FastAPI(
    title="UrbanAid API",
    description="API for discovering public utilities",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if ENVIRONMENT != "production" else None,  # Disable docs in production
    redoc_url="/redoc" if ENVIRONMENT != "production" else None
)

# ========== MIDDLEWARE (order matters - last added = first executed) ==========

# 1. Rate Limiting (applied first on requests)
app.add_middleware(
    RateLimitMiddleware,
    enabled=RATE_LIMIT_ENABLED,
    default_limit=100,
    anonymous_limit=20,
    login_limit=5,
    write_limit=10
)

# 2. Security Headers (applied to all responses)
app.add_middleware(
    SecurityHeadersMiddleware,
    enable_hsts=(ENVIRONMENT == "production")
)

# 3. CORS (must be added last to be processed first)
# SECURITY FIX: No longer using wildcard origins
ALLOWED_ORIGINS = get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]
)

# Initialize services
location_service = LocationService()
notification_service = NotificationService()
hrsa_service = HRSAService()
va_service = VAService()
usda_service = USDAService()


# ========== EXCEPTION HANDLERS ==========

@app.exception_handler(UrbanAidException)
async def urbanaid_exception_handler(request, exc: UrbanAidException):
    """Handle all UrbanAid custom exceptions"""
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


# ========== HEALTH CHECK ==========

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "UrbanAid API is running",
        "version": "2.0.0",
        "environment": ENVIRONMENT
    }


@app.get("/health/data", tags=["Health"])
async def data_health(db: Session = Depends(get_db)):
    """Report utility counts by category for data completeness verification."""
    from sqlalchemy import func
    counts = db.query(
        UtilityModel.category,
        func.count(UtilityModel.id)
    ).filter(UtilityModel.is_active == True).group_by(UtilityModel.category).all()

    total = sum(c for _, c in counts)
    return {
        "total": total,
        "by_category": {cat: count for cat, count in counts},
    }


# ========== ADMIN: SEED ENDPOINT ==========

ADMIN_SEED_KEY = os.getenv("ADMIN_SEED_KEY", "urbanaid-seed-2026")

@app.post("/admin/seed", tags=["Admin"])
async def admin_seed(
    source: str = Query(default="all", description="Source to seed: all, food, shelters, etc."),
    key: str = Query(..., description="Admin seed key"),
):
    """Trigger database seeding for specific sources."""
    if key != ADMIN_SEED_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")

    from scripts.seed_wa import SOURCE_FETCHERS, ALL_SOURCES, insert_facilities
    from models.database import SessionLocal

    valid_sources = ["all"] + ALL_SOURCES
    if source not in valid_sources:
        raise HTTPException(status_code=400, detail=f"Invalid source. Valid: {valid_sources}")

    sources_to_run = ALL_SOURCES if source == "all" else [source]

    db = SessionLocal()
    try:
        results = {}
        for src_key in sources_to_run:
            label, fetcher = SOURCE_FETCHERS[src_key]
            data = fetcher()
            if data:
                inserted, skipped = insert_facilities(db, data)
                results[label] = {"fetched": len(data), "inserted": inserted, "skipped": skipped}
            else:
                results[label] = {"fetched": 0, "inserted": 0, "skipped": 0}

        total = db.query(UtilityModel).count()
        _util_cache_invalidate()
        return {"results": results, "total_utilities": total}
    finally:
        db.close()


# ========== AUTHENTICATION ENDPOINTS ==========

@app.post("/auth/register", response_model=UserResponse, tags=["Authentication"])
async def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.

    Password requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    try:
        user = user_controller.create_user(db, user_data)
        return user
    except (UserAlreadyExistsError, ) as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration"
        )


@app.post("/auth/login", response_model=TokenResponse, tags=["Authentication"])
async def login_user(
    credentials: UserLogin = Body(...),  # SECURITY FIX: Credentials in body, not query params
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT tokens.

    Returns both access token (short-lived) and refresh token (long-lived).
    Use the refresh token to obtain new access tokens without re-entering credentials.
    """
    try:
        user, tokens = user_controller.authenticate_user(
            db,
            credentials.username,
            credentials.password
        )
        return tokens
    except (InvalidCredentialsError, InactiveUserError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login"
        )


@app.post("/auth/refresh", response_model=TokenResponse, tags=["Authentication"])
async def refresh_tokens(
    request: RefreshTokenRequest = Body(...),
    db: Session = Depends(get_db)
):
    """
    Refresh access token using a valid refresh token.

    Implements token rotation: the refresh token is invalidated and a new one is issued.
    """
    try:
        # Decode refresh token to get user_id
        token_data = decode_token(request.refresh_token)
        if not token_data or not token_data.user_id:
            raise InvalidCredentialsError("Invalid refresh token")

        tokens = user_controller.refresh_tokens(
            db,
            token_data.user_id,
            request.refresh_token
        )
        return tokens
    except (InvalidCredentialsError, InactiveUserError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )


@app.post("/auth/logout", response_model=MessageResponse, tags=["Authentication"])
async def logout_user(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log out the current user by invalidating their refresh token.
    """
    user_controller.logout_user(db, current_user.user_id)
    return MessageResponse(message="Successfully logged out")


@app.get("/auth/me", response_model=UserResponse, tags=["Authentication"])
async def get_current_user_info(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user's information.
    """
    user = user_controller.get_user_by_id(db, current_user.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/auth/password", response_model=MessageResponse, tags=["Authentication"])
async def change_password(
    password_data: PasswordChange = Body(...),
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change the current user's password.

    Requires the current password for verification.
    Invalidates all existing sessions (refresh tokens).
    """
    try:
        user_controller.change_password(db, current_user.user_id, password_data)
        return MessageResponse(message="Password changed successfully")
    except InvalidCredentialsError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ========== UTILITY ENDPOINTS ==========

# --- /utilities/all response cache (Redis or in-memory, 5-min TTL) ---
_UTILITIES_CACHE_TTL = 300  # 5 minutes

def _init_utilities_cache():
    """Create cache helpers for the /utilities/all endpoint."""
    import json as _json
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        try:
            import redis
            _redis = redis.from_url(redis_url, decode_responses=True)
            _redis.ping()

            def get(key: str):
                raw = _redis.get(f"utilities_all:{key}")
                return _json.loads(raw) if raw else None

            def put(key: str, value, ttl: int):
                _redis.setex(f"utilities_all:{key}", ttl, _json.dumps(value))

            def invalidate():
                for k in _redis.scan_iter("utilities_all:*"):
                    _redis.delete(k)

            return get, put, invalidate
        except Exception:
            pass

    # In-memory fallback
    _mem: dict = {}

    def get(key: str):
        entry = _mem.get(key)
        if entry and entry[1] > _time.time():
            return entry[0]
        return None

    def put(key: str, value, ttl: int):
        _mem[key] = (value, _time.time() + ttl)

    def invalidate():
        _mem.clear()

    return get, put, invalidate


_util_cache_get, _util_cache_put, _util_cache_invalidate = _init_utilities_cache()


@app.get("/utilities/all", tags=["Utilities"])
async def get_all_utilities(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Return ALL active utilities (no radius/limit).
    Designed for statewide map views where every pin must be visible.
    Returns lightweight payloads (~3K rows for WA).
    Response is cached for 5 minutes; invalidated on utility writes.
    """
    cache_key = category or "__all__"
    cached = _util_cache_get(cache_key)
    if cached is not None:
        return cached

    try:
        query = db.query(UtilityModel).filter(UtilityModel.is_active == True)
        if category:
            query = query.filter(UtilityModel.category == category)

        utilities = query.all()
        result = [
            {
                "id": u.id,
                "name": u.name,
                "category": u.category,
                "subcategory": u.subcategory,
                "latitude": u.latitude,
                "longitude": u.longitude,
                "description": u.description,
                "address": u.address,
                "verified": u.verified,
                "wheelchair_accessible": u.wheelchair_accessible,
                "average_rating": u.average_rating,
                "rating_count": u.rating_count,
            }
            for u in utilities
        ]
        _util_cache_put(cache_key, result, _UTILITIES_CACHE_TTL)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching all utilities: {str(e)}"
        )


@app.get("/utilities", tags=["Utilities"])
async def get_utilities(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius: float = Query(5.0, ge=0.1, le=500),
    category: Optional[str] = Query(None),
    wheelchair_accessible: Optional[bool] = Query(None),
    verified: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Find utilities near a location.

    Uses Haversine formula for accurate distance calculation.
    Results are sorted by distance from the specified coordinates.
    """
    try:
        filters = UtilityFilter(
            category=category,
            wheelchair_accessible=wheelchair_accessible,
            verified=verified
        )

        results = await utility_controller.get_nearby_utilities(
            db, latitude, longitude, radius, filters, limit, offset
        )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching utilities: {str(e)}"
        )


@app.post("/utilities", response_model=UtilityResponse, tags=["Utilities"])
async def create_utility(
    utility_data: UtilityCreate,
    db: Session = Depends(get_db),
    current_user: Optional[TokenData] = Depends(get_current_user_optional)
):
    """
    Create a new utility.

    Authentication is optional but recommended for tracking contributions.
    New utilities are unverified by default.
    """
    try:
        user_id = current_user.user_id if current_user else None
        utility = await utility_controller.create_utility(db, utility_data, user_id)
        _util_cache_invalidate()
        return utility
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating utility: {str(e)}"
        )


@app.get("/utilities/{utility_id}", response_model=UtilityResponse, tags=["Utilities"])
async def get_utility(
    utility_id: str,
    db: Session = Depends(get_db)
):
    """
    Get details for a specific utility.
    """
    utility = utility_controller.get_utility_by_id(db, utility_id)
    if not utility:
        raise HTTPException(status_code=404, detail="Utility not found")

    # Increment view count
    await utility_controller.increment_view_count(db, utility_id)

    return utility


@app.put("/utilities/{utility_id}", response_model=UtilityResponse, tags=["Utilities"])
async def update_utility(
    utility_id: str,
    utility_data: UtilityUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Update an existing utility.

    Requires authentication. Users can only update utilities they created
    unless they have moderator/admin role.
    """
    try:
        is_admin = current_user.role in ("admin", "moderator")
        utility = await utility_controller.update_utility(
            db, utility_id, utility_data, current_user.user_id, is_admin
        )
        _util_cache_invalidate()
        return utility
    except UtilityNotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail)
    except UnauthorizedError as e:
        raise HTTPException(status_code=403, detail=e.detail)


@app.delete("/utilities/{utility_id}", tags=["Utilities"])
async def delete_utility(
    utility_id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Delete a utility (soft delete).

    Requires authentication. Users can only delete utilities they created
    unless they have admin role.
    """
    try:
        is_admin = current_user.role == "admin"
        await utility_controller.delete_utility(
            db, utility_id, current_user.user_id, is_admin
        )
        _util_cache_invalidate()
        return {"message": "Utility deleted successfully"}
    except UtilityNotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail)
    except UnauthorizedError as e:
        raise HTTPException(status_code=403, detail=e.detail)


# ========== SEARCH ENDPOINTS ==========

@app.get("/search", tags=["Search"])
async def search_utilities(
    query: str = Query(..., min_length=2, description="Search query"),
    latitude: Optional[float] = Query(None, ge=-90, le=90),
    longitude: Optional[float] = Query(None, ge=-180, le=180),
    radius: float = Query(10.0, ge=0.1, le=50),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Search utilities by name, description, or category.

    When location is provided, results are filtered by distance and sorted by proximity.
    """
    try:
        results = await utility_controller.search_utilities(
            db, query, latitude, longitude, radius, limit
        )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching utilities: {str(e)}"
        )


# ========== HRSA HEALTH CENTERS ENDPOINTS ==========

@app.get("/health-centers", tags=["Health Centers"])
async def get_nearby_health_centers(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(25.0, ge=1, le=100),
    limit: int = Query(20, ge=1, le=50)
):
    """
    Find nearby HRSA Federally Qualified Health Centers (FQHCs).
    """
    try:
        health_centers = await hrsa_service.search_nearby_health_centers(
            latitude, longitude, radius_km, limit
        )
        return {
            "status": "success",
            "data": health_centers,
            "count": len(health_centers),
            "source": "HRSA - Health Resources & Services Administration"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching HRSA health centers: {str(e)}"
        )


@app.get("/health-centers/state/{state_code}", tags=["Health Centers"])
async def get_health_centers_by_state(
    state_code: str,
    limit: int = Query(100, ge=1, le=500)
):
    """Get all HRSA health centers in a specific state."""
    if len(state_code) != 2:
        raise HTTPException(
            status_code=400,
            detail="State code must be 2 characters (e.g., 'CA', 'NY')"
        )

    try:
        health_centers = await hrsa_service.fetch_health_centers_by_state(
            state_code.upper()
        )
        return {
            "status": "success",
            "data": health_centers[:limit],
            "count": min(len(health_centers), limit),
            "total_available": len(health_centers),
            "state": state_code.upper()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.get("/health-centers/{center_id}", tags=["Health Centers"])
async def get_health_center_details(center_id: str):
    """Get detailed information about a specific HRSA health center."""
    try:
        if not center_id.startswith("hrsa_"):
            center_id = f"hrsa_{center_id}"

        health_center = await hrsa_service.get_health_center_details(center_id)
        if not health_center:
            raise HTTPException(status_code=404, detail="Health center not found")

        return {"status": "success", "data": health_center}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== VA MEDICAL FACILITIES ENDPOINTS ==========

@app.get("/va-facilities", tags=["VA Facilities"])
async def get_nearby_va_facilities(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_miles: float = Query(50.0, ge=1, le=200),
    facility_type: str = Query("health"),
    limit: int = Query(20, ge=1, le=50)
):
    """Find nearby VA (Veterans Affairs) medical facilities and services."""
    try:
        va_facilities = await va_service.search_nearby_va_facilities(
            latitude, longitude, radius_miles, facility_type, limit
        )
        return {
            "status": "success",
            "data": va_facilities,
            "count": len(va_facilities),
            "source": "VA - Department of Veterans Affairs"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/va-facilities/state/{state_code}", tags=["VA Facilities"])
async def get_va_facilities_by_state(
    state_code: str,
    facility_type: str = Query("health"),
    limit: int = Query(200, ge=1, le=500)
):
    """Get all VA facilities in a specific state."""
    if len(state_code) != 2:
        raise HTTPException(status_code=400, detail="Invalid state code")

    try:
        va_facilities = await va_service.get_va_facilities_by_state(
            state_code.upper(), facility_type
        )
        return {
            "status": "success",
            "data": va_facilities[:limit],
            "count": min(len(va_facilities), limit),
            "total_available": len(va_facilities),
            "state": state_code.upper()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/va-facilities/{facility_id}", tags=["VA Facilities"])
async def get_va_facility_details(facility_id: str):
    """Get detailed information about a specific VA facility."""
    try:
        if not facility_id.startswith("va_"):
            facility_id = f"va_{facility_id}"

        va_facility = await va_service.get_va_facility_details(facility_id)
        if not va_facility:
            raise HTTPException(status_code=404, detail="VA facility not found")

        return {"status": "success", "data": va_facility}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== USDA FACILITIES ENDPOINTS ==========

@app.get("/usda-facilities", tags=["USDA Facilities"])
async def get_nearby_usda_facilities(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(50.0, ge=1, le=200),
    facility_types: str = Query("rural_development,snap,fsa"),
    limit: int = Query(20, ge=1, le=50)
):
    """Find nearby USDA facilities."""
    try:
        types_list = [t.strip() for t in facility_types.split(',') if t.strip()]
        usda_facilities = await usda_service.search_nearby_usda_facilities(
            latitude, longitude, radius_km, types_list, limit
        )
        return {
            "status": "success",
            "data": usda_facilities,
            "count": len(usda_facilities),
            "source": "USDA"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/usda-facilities/state/{state_code}", tags=["USDA Facilities"])
async def get_usda_facilities_by_state(
    state_code: str,
    facility_types: str = Query("rural_development,snap,fsa"),
    limit: int = Query(100, ge=1, le=500)
):
    """Get all USDA facilities in a specific state."""
    if len(state_code) != 2:
        raise HTTPException(status_code=400, detail="Invalid state code")

    try:
        types_list = [t.strip() for t in facility_types.split(',') if t.strip()]
        usda_facilities = await usda_service.get_usda_facilities_by_state(
            state_code.upper(), types_list
        )
        return {
            "status": "success",
            "data": usda_facilities[:limit],
            "count": min(len(usda_facilities), limit),
            "state": state_code.upper()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/usda-facilities/{facility_id}", tags=["USDA Facilities"])
async def get_usda_facility_details(facility_id: str):
    """Get detailed information about a specific USDA facility."""
    try:
        if not facility_id.startswith("usda_"):
            facility_id = f"usda_{facility_id}"

        usda_facility = await usda_service.get_usda_facility_details(facility_id)
        if not usda_facility:
            raise HTTPException(status_code=404, detail="USDA facility not found")

        return {"status": "success", "data": usda_facility}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== RATING ENDPOINTS ==========

@app.post("/utilities/{utility_id}/ratings", response_model=RatingResponse, tags=["Ratings"])
async def create_rating(
    utility_id: str,
    rating_data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)  # Require auth for ratings
):
    """
    Rate a utility (requires authentication).

    Users can only rate each utility once.
    """
    try:
        rating = rating_controller.create_rating(
            db, utility_id, rating_data, current_user.user_id
        )
        return rating
    except UtilityNotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/utilities/{utility_id}/ratings", tags=["Ratings"])
async def get_utility_ratings(
    utility_id: str,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get ratings for a specific utility."""
    try:
        ratings = rating_controller.get_utility_ratings(db, utility_id, limit, offset)
        stats = rating_controller.calculate_utility_rating_stats(db, utility_id)
        return {
            "ratings": ratings,
            "statistics": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/ratings/{rating_id}", tags=["Ratings"])
async def update_rating(
    rating_id: int,
    rating_data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """Update an existing rating (own ratings only)."""
    try:
        from schemas.rating import RatingUpdate
        update_data = RatingUpdate(rating=rating_data.rating, comment=rating_data.comment)
        rating = rating_controller.update_rating(
            db, rating_id, update_data, current_user.user_id
        )
        return rating
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/ratings/{rating_id}", tags=["Ratings"])
async def delete_rating(
    rating_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """Delete a rating (own ratings only, or admin)."""
    try:
        is_admin = current_user.role == "admin"
        rating_controller.delete_rating(db, rating_id, current_user.user_id, is_admin)
        return {"message": "Rating deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ========== REPORTING ENDPOINTS ==========

@app.post("/utilities/{utility_id}/report", tags=["Reports"])
async def report_utility(
    utility_id: str,
    reason: str = Query(..., description="Report reason"),
    description: str = Query("", description="Additional details"),
    db: Session = Depends(get_db),
    current_user: Optional[TokenData] = Depends(get_current_user_optional)
):
    """Report a utility for issues (spam, closed, dangerous, etc.)."""
    try:
        user_id = current_user.user_id if current_user else None
        report = await utility_controller.report_utility(
            db, utility_id, reason, description, user_id
        )
        await notification_service.notify_utility_reported(utility_id, reason)
        return {"message": "Report submitted successfully", "report_id": report.id}
    except UtilityNotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== ADMIN ENDPOINTS ==========

@app.post("/admin/utilities/{utility_id}/verify", tags=["Admin"])
async def verify_utility(
    utility_id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_moderator)
):
    """Verify a utility (moderator/admin only)."""
    try:
        utility = await utility_controller.verify_utility(
            db, utility_id, current_user.user_id
        )
        _util_cache_invalidate()
        return {"message": "Utility verified successfully", "utility_id": utility.id}
    except UtilityNotFoundError as e:
        raise HTTPException(status_code=404, detail=e.detail)


# ========== ANALYTICS ENDPOINTS ==========

@app.get("/analytics/stats", tags=["Analytics"])
async def get_app_statistics(db: Session = Depends(get_db)):
    """Get application statistics."""
    try:
        stats = await utility_controller.get_app_statistics(db)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== TRANSIT / ONEBUSAWAY ENDPOINTS ==========

OBA_BASE_URL = "https://api.pugetsound.onebusaway.org/api/where"
OBA_API_KEY = os.getenv("OBA_API_KEY", "TEST")


# --- Transit cache: Redis when available, in-memory fallback ---
def _init_transit_cache():
    """Create a Redis or in-memory cache for transit data."""
    import json as _json
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        try:
            import redis
            _redis = redis.from_url(redis_url, decode_responses=True)
            _redis.ping()

            def cache_get(key: str):
                raw = _redis.get(f"transit:{key}")
                return _json.loads(raw) if raw else None

            def cache_set(key: str, value, ttl: int):
                _redis.setex(f"transit:{key}", ttl, _json.dumps(value))

            return cache_get, cache_set
        except Exception:
            pass

    # In-memory fallback (single worker only)
    _mem: dict = {}

    def cache_get(key: str):
        entry = _mem.get(key)
        if entry and entry[1] > _time.time():
            return entry[0]
        return None

    def cache_set(key: str, value, ttl: int):
        _mem[key] = (value, _time.time() + ttl)

    return cache_get, cache_set


_cache_get, _cache_set = _init_transit_cache()


def _parse_arrivals(data: dict) -> list:
    """Transform OBA arrivals-and-departures response into simplified list."""
    arrivals = []
    now = _time.time() * 1000  # OBA uses epoch ms
    entry = data.get("data", {}).get("entry", {})
    for ad in entry.get("arrivalsAndDepartures", []):
        predicted = ad.get("predictedArrivalTime") or 0
        scheduled = ad.get("scheduledArrivalTime") or 0
        is_realtime = ad.get("predicted", False) and predicted > 0
        arrival_ms = predicted if is_realtime else scheduled
        minutes_until = max(0, round((arrival_ms - now) / 60000))

        # Determine status
        if is_realtime and scheduled > 0:
            diff_min = (predicted - scheduled) / 60000
            if diff_min < -1.5:
                status_str = "early"
            elif diff_min > 1.5:
                status_str = "delayed"
            else:
                status_str = "on time"
        else:
            status_str = "scheduled"

        arrivals.append({
            "routeShortName": ad.get("routeShortName") or ad.get("routeId", ""),
            "tripHeadsign": ad.get("tripHeadsign") or "",
            "predictedArrival": predicted if is_realtime else None,
            "scheduledArrival": scheduled,
            "minutesUntil": minutes_until,
            "isRealTime": is_realtime,
            "status": status_str,
        })
    # Sort by arrival time
    arrivals.sort(key=lambda a: a.get("scheduledArrival") or 0)
    return arrivals


def _parse_stop_info(data: dict) -> dict:
    """Transform OBA stop response into simplified dict."""
    entry = data.get("data", {}).get("entry", {})
    references = data.get("data", {}).get("references", {})
    routes_map = {r["id"]: r for r in references.get("routes", [])}

    route_ids = entry.get("routeIds", [])
    routes = []
    for rid in route_ids:
        r = routes_map.get(rid, {})
        routes.append({
            "shortName": r.get("shortName", rid),
            "longName": r.get("longName", ""),
            "description": r.get("description", ""),
        })

    return {
        "stopName": entry.get("name", ""),
        "routes": routes,
        "direction": entry.get("direction", ""),
    }


@app.get("/transit/arrivals/{utility_id}", tags=["Transit"])
async def get_transit_arrivals(utility_id: str, db: Session = Depends(get_db)):
    """
    Get real-time bus arrivals for a transit utility.
    Proxies to OneBusAway Puget Sound API with 30s cache.
    """
    utility = db.query(UtilityModel).filter(UtilityModel.id == utility_id).first()
    if not utility:
        raise HTTPException(status_code=404, detail="Utility not found")
    if not utility.external_id:
        raise HTTPException(status_code=404, detail="No transit stop ID linked to this utility")

    stop_id = utility.external_id
    cache_key = f"arrivals:{stop_id}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return {"arrivals": cached, "stopId": stop_id, "cached": True}

    url = f"{OBA_BASE_URL}/arrivals-and-departures-for-stop/{stop_id}.json"
    try:
        async with _httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params={
                "key": OBA_API_KEY,
                "minutesBefore": 0,
                "minutesAfter": 60,
            })
            resp.raise_for_status()
            arrivals = _parse_arrivals(resp.json())
            _cache_set(cache_key, arrivals, ttl=30)
            return {"arrivals": arrivals, "stopId": stop_id, "cached": False}
    except _httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"OBA API error: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Transit data unavailable: {str(e)}")


@app.get("/transit/stop-info/{utility_id}", tags=["Transit"])
async def get_transit_stop_info(utility_id: str, db: Session = Depends(get_db)):
    """
    Get stop details and route list for a transit utility.
    Proxies to OneBusAway with 5-minute cache.
    """
    utility = db.query(UtilityModel).filter(UtilityModel.id == utility_id).first()
    if not utility:
        raise HTTPException(status_code=404, detail="Utility not found")
    if not utility.external_id:
        raise HTTPException(status_code=404, detail="No transit stop ID linked to this utility")

    stop_id = utility.external_id
    cache_key = f"stop_info:{stop_id}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return {**cached, "cached": True}

    url = f"{OBA_BASE_URL}/stop/{stop_id}.json"
    try:
        async with _httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params={"key": OBA_API_KEY})
            resp.raise_for_status()
            info = _parse_stop_info(resp.json())
            _cache_set(cache_key, info, ttl=300)
            return {**info, "cached": False}
    except _httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"OBA API error: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Transit data unavailable: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=(ENVIRONMENT == "development"),
        log_level="info"
    )
