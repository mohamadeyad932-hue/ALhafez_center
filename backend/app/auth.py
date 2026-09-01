"""Security utilities for authentication and authorization."""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt
from sqlalchemy import func
from sqlalchemy.orm import Session

from .config import get_settings
from .database import get_db
from .models import User
from .schemas import TokenData

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> TokenData:
    """Verify and decode a JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="توكن غير صالح أو منتهي الصلاحية",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("user_id")
        user_name: str = payload.get("user_name")
        role: str = payload.get("role")
        if user_id is None:
            raise credentials_exception
        return TokenData(user_id=user_id, user_name=user_name, role=role)
    except JWTError:
        raise credentials_exception


def authenticate_user(db: Session, user_name: str, password: str) -> Optional[User]:
    """Authenticate a user by username and password."""
    user = db.query(User).filter(func.lower(User.user_name) == user_name.lower()).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Get the current authenticated user from JWT token."""
    token_data = verify_token(token)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="المستخدم غير موجود")
    return user


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Get the current authenticated admin user."""
    if current_user.role not in ["admin", "owner"]:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="لا تملك صلاحيات لدخول هذه الصفحة",
        )
    return current_user


async def get_current_owner(current_user: User = Depends(get_current_user)) -> User:
    """Get the current authenticated owner user."""
    if current_user.role != "owner":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="هذا الإجراء مسموح للمالك فقط",
        )
    return current_user
