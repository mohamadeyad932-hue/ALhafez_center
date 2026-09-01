import requests
import json

def test_api():
    url = "http://127.0.0.1:8001/api/chat"
    payload = {
        "message": "Hello, who are you?",
        "session_id": None,
        "customer_name": "Test User"
    }
    
    try:
        print(f"Connecting to {url}...")
        response = requests.post(url, json=payload, timeout=20)
        print(f"Status Code: {response.status_code}")
        # Try to print with utf-8 if possible or just raw bits
        print(f"Response Body: {response.json()}")
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    test_api()
