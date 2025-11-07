"""
Simple HTTP Server to serve the SmartIrrigate Dashboard
This avoids CORS issues when opening index.html directly
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

# Change to project directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = MyHTTPRequestHandler

print("=" * 60)
print("  SmartIrrigate Pro - Dashboard Server")
print("=" * 60)
print(f"\n✅ Starting server at http://localhost:{PORT}")
print(f"✅ ESP32 IP: 10.147.31.163")
print(f"\n🌐 Opening dashboard in browser...")
print(f"\n📡 Dashboard URL: http://localhost:{PORT}/index.html")
print(f"\n⏹️  Press Ctrl+C to stop the server\n")
print("=" * 60)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    # Open browser automatically
    webbrowser.open(f'http://localhost:{PORT}/index.html')
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n✅ Server stopped")
        httpd.shutdown()
