import http.server
import socketserver
import json
import os
import requests

# Configuration
PORT = 8000

# Gemini Models to cycle through
GEMINI_MODELS = [
    "models/gemini-2.5-flash",
    "models/gemini-flash-latest",
    "models/gemini-flash-lite-latest",
    "models/gemini-2.5-flash-lite",
    "models/gemma-3-1b-it",
    "models/gemma-3-4b-it",
    "models/gemma-3-27b-it",
    "models/gemma-3n-e4b-it",
    "models/gemma-3n-e2b-it",
    "models/gemini-3-flash-preview",
    "models/gemini-2.5-flash-preview-09-2025",
    "models/gemini-2.5-flash-lite-preview-09-2025",
    "models/gemini-robotics-er-1.5-preview"
]

def load_env():
    env = {}
    if not os.path.exists('.env'):
        return env
        
    # Try different encodings to handle various save formats
    encodings = ['utf-8', 'utf-8-sig', 'utf-16', 'latin-1']
    content = ""
    
    for enc in encodings:
        try:
            with open('.env', mode='r', encoding=enc) as f:
                content = f.read()
                print(f"📄 Successfully read .env with {enc} encoding")
                break
        except Exception:
            continue
            
    if content:
        for line in content.splitlines():
            line = line.strip()
            if line and '=' in line and not line.startswith('#'):
                try:
                    key, value = line.split('=', 1)
                    env[key.strip()] = value.strip().strip('"').strip("'")
                except Exception:
                    continue
    return env

class SimpleHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/gemini':
            # Reload env on each request to pick up changes without restart
            current_env = load_env()
            current_api_key = current_env.get('GEMINI_API_KEY', '')
            
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            payload = json.loads(post_data)

            if not current_api_key or current_api_key == 'your_api_key_here' or current_api_key == 'YOUR_ACTUAL_API_KEY_HERE':
                print("❌ API Key is missing, default, or invalid in .env")
                self.send_response(401)
                self.end_headers()
                self.wfile.write(b"Error: API Key is missing or invalid in .env file. Please add GEMINI_API_KEY to .env and refresh.")
                return

            response_content = None
            last_error = ""
            
            # Try models in order
            for model_name in GEMINI_MODELS:
                print(f"🔍 Trying Gemini model: {model_name}...")
                url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={current_api_key}"
                
                try:
                    response = requests.post(url, json=payload, timeout=30)
                    if response.status_code == 200:
                        response_content = response.content
                        print(f"✅ Success with model: {model_name}")
                        break
                    elif response.status_code == 429:
                        print(f"⚠️ Quota exceeded for model: {model_name}")
                        last_error = "QUOTA_EXCEEDED"
                        continue
                    elif response.status_code == 404:
                        print(f"❌ Model not found: {model_name}")
                        last_error = f"Model {model_name} not found"
                        continue
                    else:
                        error_json = response.json() if 'application/json' in response.headers.get('Content-Type', '') else response.text
                        print(f"❌ Error {response.status_code} with model {model_name}: {error_json}")
                        last_error = f"API Error {response.status_code}"
                        continue
                except Exception as e:
                    print(f"🚀 Request failed for {model_name}: {str(e)}")
                    last_error = str(e)
                    continue

            if response_content:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(response_content)
            else:
                print(f"💀 All models failed. Last error: {last_error}")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(last_error.encode())
        else:
            self.send_response(404)
            self.end_headers()

print(f"Starting PetMap Server on port {PORT}...")
print(f"Open http://localhost:{PORT} in your browser")
print(f"Real API Mode Enabled (using {len(GEMINI_MODELS)} models fallback)")

with socketserver.TCPServer(("", PORT), SimpleHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()
