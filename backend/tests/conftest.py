"""Test configuration and fixtures."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import get_db, Base
from app.models import User
from app.auth import hash_password

# Test database URL (in-memory SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create a test client with clean database."""
    return TestClient(app)


@pytest.fixture(scope="function")
def admin_user(db):
    """Create an admin user for testing."""
    admin = User(
        user_name="test_admin",
        password_hash=hash_password("Test_password1"),
        role="admin",
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@pytest.fixture(scope="function")
def admin_token(client, admin_user):
    """Get authentication token for admin user."""
    response = client.post("/api/auth/login", json={
        "user_name": "test_admin",
        "password": "Test_password1",
    })
    return response.json()["access_token"]


@pytest.fixture(scope="function")
def auth_headers(admin_token):
    """Get authorization headers for admin requests."""
    return {"Authorization": f"Bearer {admin_token}"}
