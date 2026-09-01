import requests
import json

def test_api():
    url = "http://127.0.0.1:8001/api/chat"
    payload = {
        "message": "مرحباً",
        "session_id": None,
        "customer_name": "Test User"
    }
    
    try:
        print(f"Connecting to {url}...")
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    test_api()
