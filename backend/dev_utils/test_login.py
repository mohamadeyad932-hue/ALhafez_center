from backend.app.auth import authenticate_user
from backend.app.database import SessionLocal

def test_login():
    db = SessionLocal()
    try:
        # Test admin/123
        user = authenticate_user(db, "admin", "123")
        if user:
            print(f"Login SUCCESS for user: {user.user_name}")
        else:
            print("Login FAILED for user: admin")
            
        # Test eyad/1234 (without the special override logic, just direct check)
        user_eyad = authenticate_user(db, "eyad", "1234")
        if user_eyad:
            print(f"Login SUCCESS for user: {user_eyad.user_name}")
        else:
            print("Login FAILED for user: eyad (Normal auth)")
    finally:
        db.close()

if __name__ == "__main__":
    test_login()
