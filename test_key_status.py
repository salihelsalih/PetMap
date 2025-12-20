import requests
import json

api_key = "AIzaSyALdkGLHO9PsBUEvgaWp1PejbmVa9zweD8"
model = "models/gemini-1.5-flash" # Use a standard known model
url = f"https://generativelanguage.googleapis.com/v1beta/{model}:generateContent?key={api_key}"

payload = {
    "contents": [{"parts": [{"text": "Hello, are you active?"}]}]
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
