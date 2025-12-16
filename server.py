
import http.server
import socketserver

# Configuration
PORT = 8000

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

print(f"Starting PetMap Server on port {PORT}...")
print(f"Open http://localhost:{PORT} in your browser")
print("All AI features are simulated locally - no external API calls")

with socketserver.TCPServer(("", PORT), SimpleHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()
