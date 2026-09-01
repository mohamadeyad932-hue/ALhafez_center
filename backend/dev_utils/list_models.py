import google.generativeai as genai
from backend.app.config import get_settings

settings = get_settings()
genai.configure(api_key=settings.GOOGLE_API_KEY)

try:
    print("Listing available models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Name: {m.name}, DisplayName: {m.display_name}")
except Exception as e:
    print(f"Error: {e}")
