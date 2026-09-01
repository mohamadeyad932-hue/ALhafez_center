"""Authentication API tests."""
import pytest
from fastapi import status


class TestAuth:
    """Test authentication endpoints."""

    def test_register_user_success(self, client):
        """Test successful user registration."""
        response = client.post("/api/auth/register", json={
            "user_name": "testuser",
            "password": "testpass123",
            "role": "customer",
        })
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_name"] == "testuser"
        assert data["role"] == "customer"
        assert "id" in data
        assert "password_hash" not in data

    def test_register_duplicate_user(self, client):
        """Test registration with duplicate username."""
        client.post("/api/auth/register", json={
            "user_name": "duplicate",
            "password": "testpass123",
            "role": "customer",
        })

        response = client.post("/api/auth/register", json={
            "user_name": "duplicate",
            "password": "testpass456",
            "role": "customer",
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "موجود مسبقاً" in response.json()["detail"]

    def test_login_success(self, client):
        """Test successful login."""
        client.post("/api/auth/register", json={
            "user_name": "loginuser",
            "password": "loginpass123",
            "role": "customer",
        })

        response = client.post("/api/auth/login", json={
            "user_name": "loginuser",
            "password": "loginpass123",
        })
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        response = client.post("/api/auth/login", json={
            "user_name": "nonexistent",
            "password": "wrongpass",
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "غير صحيحة" in response.json()["detail"]

    def test_get_current_user(self, client, admin_user, admin_token):
        """Test getting current user info."""
        response = client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {admin_token}",
        })
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_name"] == "test_admin"
        assert data["role"] == "admin"

    def test_get_current_user_unauthorized(self, client):
        """Test getting current user without token."""
        response = client.get("/api/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_user_success(self, client, admin_user, admin_token):
        """Test successful user profile update."""
        response = client.put("/api/auth/update",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "current_password": "Test_password1",
                "new_user_name": "updated_admin",
                "new_password": "new_password123",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_name"] == "updated_admin"

    def test_update_user_wrong_password(self, client, admin_user, admin_token):
        """Test update with wrong current password."""
        response = client.put("/api/auth/update",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "current_password": "wrong_password",
                "new_user_name": "updated_admin",
            },
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "غير صحيحة" in response.json()["detail"]

    def test_update_user_duplicate_username(self, client, admin_user, admin_token):
        """Test update with duplicate username."""
        client.post("/api/auth/register", json={
            "user_name": "otheruser",
            "password": "testpass123",
            "role": "customer",
        })

        response = client.put("/api/auth/update",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "current_password": "Test_password1",
                "new_user_name": "otheruser",
            },
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "مسجل مسبقاً" in response.json()["detail"]
