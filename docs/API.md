# UrbanAid API Documentation

## Overview

The UrbanAid API provides endpoints for discovering, managing, and interacting with public utilities like water fountains, restrooms, charging stations, and more.

**Base URL:** `http://localhost:8000` (development) or `https://api.urbanaid.com` (production)

## Authentication

Most endpoints support both anonymous and authenticated requests. Authentication is optional but provides additional features like:

- Adding utilities to your profile
- Rating and reviewing utilities
- Reporting issues
- Accessing personal utility history

### Authentication Headers

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Health Check

#### GET /health
Check API status and health.

**Response:**
```json
{
  "status": "healthy",
  "message": "UrbanAid API is running",
  "version": "1.0.0"
}
```

---

### Utilities

#### GET /utilities
Get nearby utilities based on location and filters.

**Parameters:**
- `latitude` (float, required): User's latitude
- `longitude` (float, required): User's longitude  
- `radius` (float, optional): Search radius in kilometers (default: 5.0, max: 50.0)
- `category` (string, optional): Filter by utility category
- `verified_only` (boolean, optional): Show only verified utilities (default: false)
- `wheelchair_accessible` (boolean, optional): Filter by accessibility
- `open_now` (boolean, optional): Show only currently open utilities (default: false)
- `limit` (int, optional): Maximum results (default: 50, max: 100)

**Example Request:**
```
GET /utilities?latitude=40.7128&longitude=-74.0060&radius=2.0&category=water_fountain&limit=20
```

**Response:**
```json
[
  {
    "id": "utility_123",
    "name": "Central Park Water Fountain",
    "category": "water_fountain",
    "latitude": 40.7829,
    "longitude": -73.9654,
    "description": "Clean water fountain near the playground area",
    "address": "Central Park, New York, NY",
    "phone": null,
    "website": null,
    "hours": "24/7",
    "verified": true,
    "wheelchair_accessible": true,
    "rating": 4.5,
    "rating_count": 23,
    "distance": 0.8,
    "images": ["https://example.com/image1.jpg"],
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-20T14:30:00Z",
    "created_by": "user_456"
  }
]
```

#### GET /utilities/{utility_id}
Get specific utility by ID.

**Response:**
```json
{
  "id": "utility_123",
  "name": "Central Park Water Fountain",
  "category": "water_fountain",
  "latitude": 40.7829,
  "longitude": -73.9654,
  "description": "Clean water fountain near the playground area",
  "verified": true,
  "wheelchair_accessible": true,
  "rating": 4.5,
  "rating_count": 23
}
```

#### POST /utilities
Create a new utility (anonymous or authenticated).

**Request Body:**
```json
{
  "name": "New Water Fountain",
  "category": "water_fountain",
  "latitude": 40.7829,
  "longitude": -73.9654,
  "description": "Fresh water fountain near the park entrance",
  "address": "123 Park Avenue, New York, NY",
  "phone": "+1-555-0123",
  "website": "https://example.com",
  "hours": "6:00 AM - 10:00 PM",
  "wheelchair_accessible": true,
  "images": ["base64_image_data_or_url"]
}
```

**Response:**
```json
{
  "id": "utility_789",
  "name": "New Water Fountain",
  "category": "water_fountain",
  "latitude": 40.7829,
  "longitude": -73.9654,
  "verified": false,
  "created_at": "2024-01-21T09:15:00Z"
}
```

#### PUT /utilities/{utility_id}
Update existing utility (requires authentication and ownership).

#### DELETE /utilities/{utility_id}
Delete utility (requires authentication and ownership).

---

### Search

#### GET /search
Search utilities by name, description, or category.

**Parameters:**
- `query` (string, required): Search query
- `latitude` (float, required): User's latitude
- `longitude` (float, required): User's longitude
- `radius` (float, optional): Search radius in kilometers (default: 10.0)
- `limit` (int, optional): Maximum results (default: 20, max: 50)

**Example Request:**
```
GET /search?query=water fountain&latitude=40.7128&longitude=-74.0060&limit=10
```

---

### Ratings

#### POST /utilities/{utility_id}/ratings
Rate a utility (anonymous or authenticated).

**Request Body:**
```json
{
  "rating": 4,
  "comment": "Clean water, easily accessible"
}
```

#### GET /utilities/{utility_id}/ratings
Get ratings for a specific utility.

**Parameters:**
- `limit` (int, optional): Maximum ratings to return (default: 10, max: 50)

---

### Reports

#### POST /utilities/{utility_id}/report
Report a utility for issues.

**Request Body:**
```json
{
  "reason": "closed_permanently",
  "description": "This water fountain has been removed"
}
```

**Reason Options:**
- `closed_permanently`
- `closed_temporarily` 
- `unsafe`
- `spam`
- `inappropriate`
- `incorrect_location`
- `other`

---

### User Management

#### POST /auth/register
Register a new user (optional for app usage).

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secure_password"
}
```

#### POST /auth/login
Login user and receive access token.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### GET /auth/me
Get current user information (requires authentication).

---

## Utility Categories

- `water_fountain` - Public water fountains
- `restroom` - Public restrooms
- `bench` - Public seating/benches
- `handwashing` - Handwashing stations
- `shelter` - Emergency shelters
- `free_food` - Free food locations (soup kitchens, pantries)
- `wifi` - Public Wi-Fi hotspots
- `charging` - Phone/device charging stations
- `transit` - Public transit stops
- `library` - Public libraries
- `clinic` - Community health clinics

## Error Responses

All endpoints return consistent error responses:

```json
{
  "detail": "Error message description",
  "error_code": "SPECIFIC_ERROR_CODE"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited to prevent abuse:
- Anonymous users: 100 requests per hour
- Authenticated users: 1000 requests per hour

## Pagination

For endpoints returning lists, pagination is supported:

**Parameters:**
- `offset` (int, optional): Number of items to skip (default: 0)
- `limit` (int, optional): Number of items to return

**Response includes pagination info:**
```json
{
  "items": [...],
  "total": 150,
  "offset": 0,
  "limit": 20,
  "has_more": true
}
```

## WebSocket Events (Future)

Real-time updates for utility changes:
- New utilities added nearby
- Utility status changes
- Rating updates

## SDK Integration

For easier integration, consider using our official SDKs:
- JavaScript/TypeScript
- React Native
- Flutter
- iOS (Swift)
- Android (Kotlin) 