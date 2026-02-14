import http.server
import socketserver
import json
import sqlite3
import os
import sys
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Try to import Twilio
try:
    from twilio_client import twilio
    TWILIO_AVAILABLE = True
except:
    TWILIO_AVAILABLE = False
    print("[WARN] Twilio not available")

DB_PATH = os.path.join(os.path.dirname(__file__), 'genii.db')

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length else b'{}'
        
        try:
            data = json.loads(post_data)
        except:
            data = {}
        
        if self.path == '/api/signup':
            self.handle_signup(data)
            return
        elif self.path == '/api/sms/webhook':
            self.handle_sms_webhook(data)
            return
        
        self.send_json({"error": "Not found"}, 404)
    
    def handle_signup(self, data):
        company = data.get('company', '')
        email = data.get('email', '')
        phone = data.get('phone', '')
        
        if not company or not email:
            self.send_json({"error": "Company and email required"}, 400)
            return
        
        api_key = 'gk_' + os.urandom(16).hex()
        
        # Store in database
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("INSERT INTO users (company, email, phone, api_key, created_at) VALUES (?, ?, ?, ?, ?)",
                 (company, email, phone, api_key, datetime.now().isoformat()))
        user_id = c.lastrowid
        conn.commit()
        conn.close()
        
        # Send welcome SMS immediately
        sms_sent = False
        if TWILIO_AVAILABLE and phone:
            try:
                result = twilio.send_welcome_message(phone, email.split('@')[0], company)
                sms_sent = result.get('success', False)
            except Exception as e:
                print(f"[SMS] Failed to send: {e}")
        
        self.send_json({
            "success": True,
            "message": "Welcome to Genii Enterprises",
            "company_id": user_id,
            "api_key": api_key,
            "sms_sent": sms_sent,
            "dashboard_url": f"/?key={api_key}"
        })
    
    def handle_sms_webhook(self, data):
        """Handle incoming SMS replies"""
        from_number = data.get('From')
        body = data.get('Body', '').lower()
        
        # Find user by phone
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT id, company FROM users WHERE phone = ?", (from_number,))
        user = c.fetchone()
        conn.close()
        
        if user:
            user_id, company = user
            
            # Process commands
            if 'help' in body:
                response = "Genii Help:\nSTART - Begin onboarding\nBRIEF - Executive summary\nCALL - Schedule intro call\nDASHBOARD - Get login link"
            elif 'start' in body:
                response = f"Welcome aboard! Your 47 AI employees at {company} are ready. Access your dashboard to meet your C-Suite team."
            elif 'brief' in body:
                response = "Chairman's Brief: All systems operational. 47 AI employees active. No urgent items."
            elif 'dashboard' in body:
                response = "Access your dashboard: https://interactions-year-cancel-technological.trycloudflare.com"
            else:
                response = f"Thanks for your message! I'm connecting you with the right team member at {company}. Expect a response within 5 minutes."
            
            # Send reply
            if TWILIO_AVAILABLE:
                twilio.send_sms(from_number, response)
        
        self.send_json({"success": True})
    
    def do_GET(self):
        if self.path == '/api/health':
            self.send_json({
                "status": "healthy",
                "version": "2.1.0",
                "twilio": TWILIO_AVAILABLE,
                "time": datetime.now().isoformat()
            })
            return
        super().do_GET()
    
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

PORT = 8888
print("?? GENII ENTERPRISES v2.1")
print(f"?? Twilio SMS: {'Enabled' if TWILIO_AVAILABLE else 'Disabled'}")
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"? Platform ready on port {PORT}")
    httpd.serve_forever()
