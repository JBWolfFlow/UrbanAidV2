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