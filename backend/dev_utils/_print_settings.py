from backend.app.config import get_settings

s = get_settings()
print("DATABASE_URL=" + s.DATABASE_URL)
print("GOOGLE_API_KEY_SET=" + str(bool(s.GOOGLE_API_KEY)))
