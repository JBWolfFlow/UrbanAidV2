"""
Pytest Configuration and Fixtures

Provides test database setup, client fixtures, and authentication helpers.
"""

import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime, timedelta

# Set test environment before importing app
os.environ["ENVIRONMENT"] = "testing"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"

from models.database import Base, get_db
from models import User, UserRole, Utility, Rating
from utils.auth import get_password_hash, create_access_token


# =============================================================================
# Test Database Setup
# =============================================================================

# Create test engine with in-memory SQLite
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    """Override database dependency for testing."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture(scope="function")
def db_session():
    """
    Create a fresh database session for each test.

    Creates all tables before the test and drops them after.
    """
    # Create tables
    Base.metadata.create_all(bind=test_engine)

    # Create session
    session = TestSessionLocal()

    yield session

    # Cleanup
    session.close()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    Create a test client with database dependency override.
    """
    from main import app

    # Override the database dependency
    app.dependency_overrides[get_db] = lambda: db_session

    with TestClient(app) as test_client:
        yield test_client

    # Clear overrides
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session) -> User:
    """
    Create a standard test user.
    """
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("TestPassword123!"),
        role=UserRole.USER,
        is_active=True,
        email_verified=True,
        created_at=datetime.utcnow(),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_admin(db_session) -> User:
    """
    Create an admin test user.
    """
    admin = User(
        username="adminuser",
        email="admin@example.com",
        hashed_password=get_password_hash("AdminPassword123!"),
        role=UserRole.ADMIN,
        is_active=True,
        email_verified=True,
        created_at=datetime.utcnow(),
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def test_moderator(db_session) -> User:
    """
    Create a moderator test user.
    """
    moderator = User(
        username="moduser",
        email="mod@example.com",
        hashed_password=get_password_hash("ModPassword123!"),
        role=UserRole.MODERATOR,
        is_active=True,
        email_verified=True,
        created_at=datetime.utcnow(),
    )
    db_session.add(moderator)
    db_session.commit()
    db_session.refresh(moderator)
    return moderator


@pytest.fixture
def inactive_user(db_session) -> User:
    """
    Create an inactive test user.
    """
    user = User(
        username="inactiveuser",
        email="inactive@example.com",
        hashed_password=get_password_hash("InactivePassword123!"),
        role=UserRole.USER,
        is_active=False,
        email_verified=False,
        created_at=datetime.utcnow(),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user) -> dict:
    """
    Create authorization headers for the test user.
    """
    token = create_access_token(
        data={"sub": test_user.username, "user_id": test_user.id, "role": "user"}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(test_admin) -> dict:
    """
    Create authorization headers for the admin user.
    """
    token = create_access_token(
        data={"sub": test_admin.username, "user_id": test_admin.id, "role": "admin"}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def moderator_headers(test_moderator) -> dict:
    """
    Create authorization headers for the moderator user.
    """
    token = create_access_token(
        data={
            "sub": test_moderator.username,
            "user_id": test_moderator.id,
            "role": "moderator",
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def expired_token_headers() -> dict:
    """
    Create authorization headers with an expired token.
    """
    token = create_access_token(
        data={"sub": "testuser", "user_id": 1},
        expires_delta=timedelta(minutes=-30),  # Expired 30 minutes ago
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_utility(db_session, test_user) -> Utility:
    """
    Create a test utility.
    """
    utility = Utility(
        id="test-utility-001",
        name="Test Food Bank",
        category="free_food",
        address="123 Test Street, Test City, TS 12345",
        latitude=40.7128,
        longitude=-74.0060,
        phone="555-123-4567",
        description="A test food bank for unit testing",
        verified=True,
        creator_id=test_user.id,
        created_at=datetime.utcnow(),
    )
    db_session.add(utility)
    db_session.commit()
    db_session.refresh(utility)
    return utility


@pytest.fixture
def test_utilities(db_session, test_user) -> list:
    """
    Create multiple test utilities for geo query testing.
    """
    utilities = [
        Utility(
            id=f"utility-{i}",
            name=f"Test Utility {i}",
            category=["free_food", "shelter", "health_center"][i % 3],
            address=f"{i * 100} Test Ave, Test City, TS",
            latitude=40.7128 + (i * 0.01),
            longitude=-74.0060 + (i * 0.01),
            verified=i % 2 == 0,
            creator_id=test_user.id,
            created_at=datetime.utcnow(),
        )
        for i in range(10)
    ]
    db_session.add_all(utilities)
    db_session.commit()
    return utilities


@pytest.fixture
def test_rating(db_session, test_user, test_utility) -> Rating:
    """
    Create a test rating.
    """
    rating = Rating(
        user_id=test_user.id,
        utility_id=test_utility.id,
        rating=4,
        comment="Great service, very helpful staff!",
        is_active=True,
        created_at=datetime.utcnow(),
    )
    db_session.add(rating)
    db_session.commit()
    db_session.refresh(rating)
    return rating


# =============================================================================
# Helper Functions
# =============================================================================


def create_test_user(
    db_session,
    username: str = "newuser",
    email: str = "new@example.com",
    password: str = "NewPassword123!",
    role: UserRole = UserRole.USER,
    is_active: bool = True,
) -> User:
    """
    Helper function to create a user with custom attributes.
    """
    user = User(
        username=username,
        email=email,
        hashed_password=get_password_hash(password),
        role=role,
        is_active=is_active,
        email_verified=True,
        created_at=datetime.utcnow(),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def get_auth_token(user: User) -> str:
    """
    Helper function to get an auth token for a user.
    """
    return create_access_token(data={"sub": user.username, "user_id": user.id})
