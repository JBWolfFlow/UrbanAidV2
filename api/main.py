"""
UrbanAid API - FastAPI backend for public utility discovery
Provides endpoints for finding, adding, and managing public utilities
"""
from fastapi import FastAPI, HTTPException, Depends, Query, status
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
from schemas.user import UserCreate, UserResponse
from schemas.rating import RatingCreate, RatingResponse
from controllers.utility_controller import UtilityController
from controllers.user_controller import UserController
from controllers.rating_controller import RatingController
from services.location_service import LocationService
from services.notification_service import NotificationService
from services.hrsa_service import HRSAService
from services.va_service import VAService
from services.usda_service import USDAService
from utils.auth import get_current_user, create_access_token
from utils.exceptions import UtilityNotFoundError, UnauthorizedError

# Security
security = HTTPBearer(auto_error=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    init_db()
    print("🚀 UrbanAid API started successfully")
    yield
    # Shutdown
    print("👋 UrbanAid API shutting down")

# Initialize FastAPI app
app = FastAPI(
    title="UrbanAid API",
    description="API for discovering public utilities",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize controllers
utility_controller = UtilityController()
user_controller = UserController()
rating_controller = RatingController()
location_service = LocationService()
notification_service = NotificationService()
hrsa_service = HRSAService()
va_service = VAService()
usda_service = USDAService()

# ========== HEALTH CHECK ==========

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "UrbanAid API is running"}

# ========== UTILITY ENDPOINTS ==========

@app.get("/utilities", response_model=List[UtilityResponse], tags=["Utilities"])
async def get_utilities(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius: float = Query(5.0),
    category: Optional[str] = Query(None),
    limit: int = Query(50, le=100)
):
    mock_utilities = [
        {
            "id": "1",
            "name": "Central Park Water Fountain",
            "category": "water_fountain",
            "latitude": latitude + 0.001,
            "longitude": longitude + 0.001,
            "description": "Clean water fountain",
            "verified": True,
            "wheelchair_accessible": True,
            "rating": 4.5
        }
    ]
    
    if category:
        mock_utilities = [u for u in mock_utilities if u["category"] == category]
    
    return mock_utilities[:limit]

@app.post("/utilities", response_model=UtilityResponse, tags=["Utilities"])
async def create_utility(utility_data: dict):
    required_fields = ["name", "category", "latitude", "longitude"]
    for field in required_fields:
        if field not in utility_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required field: {field}"
            )
    
    return {
        "id": "new_id",
        "name": utility_data["name"],
        "category": utility_data["category"],
        "latitude": utility_data["latitude"],
        "longitude": utility_data["longitude"],
        "verified": False
    }

@app.put("/utilities/{utility_id}", response_model=UtilityResponse, tags=["Utilities"])
async def update_utility(
    utility_id: str,
    utility_data: UtilityUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Update existing utility (requires authentication)
    """
    try:
        utility = await utility_controller.update_utility(
            db, 
            utility_id, 
            utility_data, 
            current_user.id
        )
        
        if not utility:
            raise UtilityNotFoundError(f"Utility with ID {utility_id} not found")
        
        return utility
    except UtilityNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating utility: {str(e)}"
        )

@app.delete("/utilities/{utility_id}", tags=["Utilities"])
async def delete_utility(
    utility_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Delete utility (requires authentication and ownership)
    """
    try:
        success = await utility_controller.delete_utility(db, utility_id, current_user.id)
        if not success:
            raise UtilityNotFoundError(f"Utility with ID {utility_id} not found")
        
        return {"message": "Utility deleted successfully"}
    except UtilityNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting utility: {str(e)}"
        )

# ========== SEARCH ENDPOINTS ==========

@app.get("/search", response_model=List[UtilityResponse], tags=["Search"])
async def search_utilities(
    query: str = Query(..., description="Search query"),
    latitude: float = Query(..., description="User's latitude"),
    longitude: float = Query(..., description="User's longitude"),
    radius: float = Query(10.0, description="Search radius in kilometers"),
    limit: int = Query(20, le=50, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """
    Search utilities by name, description, or category
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
    latitude: float = Query(..., description="User's latitude"),
    longitude: float = Query(..., description="User's longitude"),
    radius_km: float = Query(25.0, description="Search radius in kilometers"),
    limit: int = Query(20, le=50, description="Maximum number of results")
):
    """
    Find nearby HRSA Federally Qualified Health Centers (FQHCs)
    
    Returns health centers from the Health Resources & Services Administration database
    including community health centers, migrant health centers, and other FQHCs.
    """
    try:
        health_centers = await hrsa_service.search_nearby_health_centers(
            latitude, longitude, radius_km, limit
        )
        
        return {
            "status": "success",
            "data": health_centers,
            "count": len(health_centers),
            "search_params": {
                "latitude": latitude,
                "longitude": longitude,
                "radius_km": radius_km,
                "limit": limit
            },
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
    limit: int = Query(100, le=500, description="Maximum number of results")
):
    """
    Get all HRSA health centers in a specific state
    
    Args:
        state_code: Two-letter state code (e.g., 'CA', 'NY', 'TX')
        limit: Maximum number of results to return
    """
    try:
        # Validate state code format
        if len(state_code) != 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="State code must be 2 characters (e.g., 'CA', 'NY')"
            )
        
        health_centers = await hrsa_service.fetch_health_centers_by_state(
            state_code.upper()
        )
        
        # Apply limit
        limited_centers = health_centers[:limit]
        
        return {
            "status": "success",
            "data": limited_centers,
            "count": len(limited_centers),
            "total_available": len(health_centers),
            "state": state_code.upper(),
            "source": "HRSA - Health Resources & Services Administration"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching health centers for state {state_code}: {str(e)}"
        )

@app.get("/health-centers/{center_id}", tags=["Health Centers"])
async def get_health_center_details(center_id: str):
    """
    Get detailed information about a specific HRSA health center
    
    Args:
        center_id: HRSA health center ID (with or without 'hrsa_' prefix)
    """
    try:
        # Ensure proper ID format
        if not center_id.startswith("hrsa_"):
            center_id = f"hrsa_{center_id}"
        
        health_center = await hrsa_service.get_health_center_details(center_id)
        
        if not health_center:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Health center with ID {center_id} not found"
            )
        
        return {
            "status": "success",
            "data": health_center,
            "source": "HRSA - Health Resources & Services Administration"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                         detail=f"Error fetching health center details: {str(e)}"
         )

# ========== VA MEDICAL FACILITIES ENDPOINTS ==========

@app.get("/va-facilities", tags=["VA Facilities"])
async def get_nearby_va_facilities(
    latitude: float = Query(..., description="User's latitude"),
    longitude: float = Query(..., description="User's longitude"),
    radius_miles: float = Query(50.0, description="Search radius in miles"),
    facility_type: str = Query("health", description="Facility type: health, benefits, cemetery, vet_center"),
    limit: int = Query(20, le=50, description="Maximum number of results")
):
    """
    Find nearby VA (Veterans Affairs) medical facilities and services
    
    Returns facilities from the Department of Veterans Affairs including:
    - VA Medical Centers (VAMC)
    - Community Based Outpatient Clinics (CBOC)
    - Vet Centers
    - Regional Benefit Offices
    - National Cemeteries
    """
    try:
        va_facilities = await va_service.search_nearby_va_facilities(
            latitude, longitude, radius_miles, facility_type, limit
        )
        
        return {
            "status": "success",
            "data": va_facilities,
            "count": len(va_facilities),
            "search_params": {
                "latitude": latitude,
                "longitude": longitude,
                "radius_miles": radius_miles,
                "facility_type": facility_type,
                "limit": limit
            },
            "source": "VA - Department of Veterans Affairs"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching VA facilities: {str(e)}"
        )

@app.get("/va-facilities/state/{state_code}", tags=["VA Facilities"])
async def get_va_facilities_by_state(
    state_code: str,
    facility_type: str = Query("health", description="Facility type"),
    limit: int = Query(200, le=500, description="Maximum number of results")
):
    """
    Get all VA facilities in a specific state
    
    Args:
        state_code: Two-letter state code (e.g., 'CA', 'NY', 'TX')
        facility_type: Type of facility to search for
        limit: Maximum number of results to return
    """
    try:
        # Validate state code format
        if len(state_code) != 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="State code must be 2 characters (e.g., 'CA', 'NY')"
            )
        
        va_facilities = await va_service.get_va_facilities_by_state(
            state_code.upper(), facility_type
        )
        
        # Apply limit
        limited_facilities = va_facilities[:limit]
        
        return {
            "status": "success",
            "data": limited_facilities,
            "count": len(limited_facilities),
            "total_available": len(va_facilities),
            "state": state_code.upper(),
            "facility_type": facility_type,
            "source": "VA - Department of Veterans Affairs"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching VA facilities for state {state_code}: {str(e)}"
        )

@app.get("/va-facilities/{facility_id}", tags=["VA Facilities"])
async def get_va_facility_details(facility_id: str):
    """
    Get detailed information about a specific VA facility
    
    Args:
        facility_id: VA facility ID (with or without 'va_' prefix)
    """
    try:
        # Ensure proper ID format
        if not facility_id.startswith("va_"):
            facility_id = f"va_{facility_id}"
        
        va_facility = await va_service.get_va_facility_details(facility_id)
        
        if not va_facility:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"VA facility with ID {facility_id} not found"
            )
        
        return {
            "status": "success",
            "data": va_facility,
            "source": "VA - Department of Veterans Affairs"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                         detail=f"Error fetching VA facility details: {str(e)}"
         )

# ========== USDA FACILITIES ENDPOINTS ==========

@app.get("/usda-facilities", tags=["USDA Facilities"])
async def get_nearby_usda_facilities(
    latitude: float = Query(..., description="User's latitude"),
    longitude: float = Query(..., description="User's longitude"),
    radius_km: float = Query(50.0, description="Search radius in kilometers"),
    facility_types: str = Query("rural_development,snap,fsa", description="Comma-separated facility types"),
    limit: int = Query(20, le=50, description="Maximum number of results")
):
    """
    Find nearby USDA (United States Department of Agriculture) facilities
    
    Returns facilities from various USDA agencies including:
    - Rural Development Offices (housing, business loans, community facilities)
    - SNAP/Food Assistance Offices (food benefits, nutrition programs)
    - Farm Service Agency Centers (farm loans, conservation, crop insurance)
    - Extension Offices (agricultural education, 4-H programs)
    """
    try:
        # Parse facility types
        types_list = [t.strip() for t in facility_types.split(',') if t.strip()]
        
        usda_facilities = await usda_service.search_nearby_usda_facilities(
            latitude, longitude, radius_km, types_list, limit
        )
        
        return {
            "status": "success",
            "data": usda_facilities,
            "count": len(usda_facilities),
            "search_params": {
                "latitude": latitude,
                "longitude": longitude,
                "radius_km": radius_km,
                "facility_types": types_list,
                "limit": limit
            },
            "source": "USDA - United States Department of Agriculture"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching USDA facilities: {str(e)}"
        )

@app.get("/usda-facilities/state/{state_code}", tags=["USDA Facilities"])
async def get_usda_facilities_by_state(
    state_code: str,
    facility_types: str = Query("rural_development,snap,fsa", description="Comma-separated facility types"),
    limit: int = Query(100, le=500, description="Maximum number of results")
):
    """
    Get all USDA facilities in a specific state
    
    Args:
        state_code: Two-letter state code (e.g., 'CA', 'NY', 'TX')
        facility_types: Comma-separated list of facility types to include
        limit: Maximum number of results to return
    """
    try:
        # Validate state code format
        if len(state_code) != 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="State code must be 2 characters (e.g., 'CA', 'NY')"
            )
        
        # Parse facility types
        types_list = [t.strip() for t in facility_types.split(',') if t.strip()]
        
        usda_facilities = await usda_service.get_usda_facilities_by_state(
            state_code.upper(), types_list
        )
        
        # Apply limit
        limited_facilities = usda_facilities[:limit]
        
        return {
            "status": "success",
            "data": limited_facilities,
            "count": len(limited_facilities),
            "total_available": len(usda_facilities),
            "state": state_code.upper(),
            "facility_types": types_list,
            "source": "USDA - United States Department of Agriculture"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching USDA facilities for state {state_code}: {str(e)}"
        )

@app.get("/usda-facilities/{facility_id}", tags=["USDA Facilities"])
async def get_usda_facility_details(facility_id: str):
    """
    Get detailed information about a specific USDA facility
    
    Args:
        facility_id: USDA facility ID (e.g., 'usda_rd_12345' or 'usda_snap_67890')
    """
    try:
        # Ensure proper ID format
        if not facility_id.startswith("usda_"):
            facility_id = f"usda_{facility_id}"
        
        usda_facility = await usda_service.get_usda_facility_details(facility_id)
        
        if not usda_facility:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"USDA facility with ID {facility_id} not found"
            )
        
        return {
            "status": "success",
            "data": usda_facility,
            "source": "USDA - United States Department of Agriculture"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching USDA facility details: {str(e)}"
        )

# ========== RATING ENDPOINTS ==========

@app.post("/utilities/{utility_id}/ratings", response_model=RatingResponse, tags=["Ratings"])
async def create_rating(
    utility_id: str,
    rating_data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_current_user)
):
    """
    Rate a utility (anonymous or authenticated)
    """
    try:
        rating = await rating_controller.create_rating(
            db, 
            utility_id, 
            rating_data, 
            user_id=current_user.id if current_user else None
        )
        return rating
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating rating: {str(e)}"
        )

@app.get("/utilities/{utility_id}/ratings", response_model=List[RatingResponse], tags=["Ratings"])
async def get_utility_ratings(
    utility_id: str,
    limit: int = Query(10, le=50, description="Maximum number of ratings"),
    db: Session = Depends(get_db)
):
    """
    Get ratings for a specific utility
    """
    try:
        ratings = await rating_controller.get_utility_ratings(db, utility_id, limit)
        return ratings
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching ratings: {str(e)}"
        )

# ========== USER ENDPOINTS ==========

@app.post("/auth/register", response_model=UserResponse, tags=["Authentication"])
async def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user (optional for app usage)
    """
    try:
        user = await user_controller.create_user(db, user_data)
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

@app.post("/auth/login", tags=["Authentication"])
async def login_user(
    username: str,
    password: str,
    db: Session = Depends(get_db)
):
    """
    Login user and return access token
    """
    try:
        user = await user_controller.authenticate_user(db, username, password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during login: {str(e)}"
        )

@app.get("/auth/me", response_model=UserResponse, tags=["Authentication"])
async def get_current_user_info(
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get current user information
    """
    return current_user

# ========== REPORTING ENDPOINTS ==========

@app.post("/utilities/{utility_id}/report", tags=["Reports"])
async def report_utility(
    utility_id: str,
    reason: str,
    description: str = "",
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_current_user)
):
    """
    Report a utility for issues (spam, closed, dangerous, etc.)
    """
    try:
        report = await utility_controller.report_utility(
            db, 
            utility_id, 
            reason, 
            description, 
            user_id=current_user.id if current_user else None
        )
        
        # Send notification to moderators
        await notification_service.notify_utility_reported(utility_id, reason)
        
        return {"message": "Report submitted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting report: {str(e)}"
        )

# ========== ANALYTICS ENDPOINTS ==========

@app.get("/analytics/stats", tags=["Analytics"])
async def get_app_statistics(db: Session = Depends(get_db)):
    """
    Get application statistics
    """
    try:
        stats = await utility_controller.get_app_statistics(db)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching statistics: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 