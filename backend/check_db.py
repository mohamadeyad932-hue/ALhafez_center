import sys
import os
from pathlib import Path

# Add the project root to sys.path
root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.append(str(root_dir))

from app.database import SessionLocal
from app.models import User

def check_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Found {len(users)} users:")
        for u in users:
            print(f"- ID: {u.id}, Name: {u.user_name}, Role: {u.role}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
