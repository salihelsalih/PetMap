import requests

api_key = "AIzaSyALdkGLHO9PsBUEvgaWp1PejbmVa9zweD8"
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        models = response.json().get('models', [])
        print(f"Total models found: {len(models)}")
        # Print first few model names
        for m in models[:5]:
            print(f" - {m['name']}")
    else:
        print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
