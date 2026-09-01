"""Authentication API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import authenticate_user, create_access_token, get_current_user, hash_password, verify_password
from app.database import get_db
from app.models import User
from app.schemas import Token, UserCreate, UserLogin, UserUpdate, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        existing_user = (
            db.query(User)
            .filter(func.lower(User.user_name) == user_data.user_name.lower())
            .first()
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="اسم المستخدم موجود مسبقاً",
            )

        new_user = User(
            user_name=user_data.user_name.strip(),
            password_hash=hash_password(user_data.password.strip()),
            role=user_data.role.value.lower(),
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء التسجيل: {exc}")


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return access token."""
    user_name = login_data.user_name.strip()
    password = login_data.password.strip()

    user = authenticate_user(db, user_name, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="اسم المستخدم أو كلمة المرور غير صحيحة",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"user_id": user.id, "user_name": user.user_name, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user


@router.put("/update", response_model=UserResponse)
async def update_user(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user profile. Requires current password."""
    try:
        # Verify current password
        if not verify_password(update_data.current_password.strip(), current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="كلمة المرور الحالية غير صحيحة",
            )

        # Update username if provided
        if update_data.new_user_name:
            new_un = update_data.new_user_name.strip()
            existing = db.query(User).filter(
                User.user_name == new_un,
                User.id != current_user.id,
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="اسم المستخدم الجديد مسجل مسبقاً",
                )
            current_user.user_name = new_un

        # Update password if provided
        if update_data.new_password:
            current_user.password_hash = hash_password(update_data.new_password.strip())

        db.commit()
        db.refresh(current_user)
        return current_user
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء تحديث المستخدم: {exc}")
