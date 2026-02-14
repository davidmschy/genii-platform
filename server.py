import http.server
import socketserver
import json
import sqlite3
import os
import sys
from datetime import datetime
from urllib.parse import parse_qs

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

# Try to import optional modules
try:
    from openclaw_bridge import openclaw_bridge
    OPENCLAW_AVAILABLE = True
except:
    OPENCLAW_AVAILABLE = False
    print("[WARN] OpenClaw bridge not available")

try:
    from mailgun import mailgun
    MAILGUN_AVAILABLE = True
except:
    MAILGUN_AVAILABLE = False
    print("[WARN] Mailgun not available")

# Database setup
DB_PATH = os.path.join(os.path.dirname(__file__), 'genii.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY, company TEXT, email TEXT, api_key TEXT, created_at TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS agents
                 (id INTEGER PRIMARY KEY, user_id INTEGER, agent_id TEXT, agent_name TEXT, hired_at TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS conversations
                 (id INTEGER PRIMARY KEY, user_email TEXT, agent_id TEXT, message TEXT, 
                  response TEXT, created_at TEXT)''')
    conn.commit()
    conn.close()

init_db()

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            health = {
                "status": "healthy",
                "time": datetime.now().isoformat(),
                "features": {
                    "database": True,
                    "openclaw": OPENCLAW_AVAILABLE,
                    "mailgun": MAILGUN_AVAILABLE
                }
            }
            self.wfile.write(json.dumps(health).encode())
            return
        elif self.path == '/api/users':
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("SELECT company, email, created_at FROM users ORDER BY created_at DESC LIMIT 10")
            users = [{"company": row[0], "email": row[1], "created_at": row[2]} for row in c.fetchall()]
            conn.close()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"users": users, "count": len(users)}).encode())
            return
        elif self.path.startswith('/api/agent/'):
            # Get agent response
            parts = self.path.split('/')
            if len(parts) >= 4:
                agent_id = parts[3]
                message = parse_qs(self.path.split('?')[1]) if '?' in self.path else {}
                
                if OPENCLAW_AVAILABLE:
                    response = openclaw_bridge.send_message_to_agent(
                        agent_id, 
                        message.get('message', ['Hello'])[0]
                    )
                else:
                    response = {
                        "content": f"Hi! This is {agent_id}. I'm ready to help! Please configure OpenClaw for full functionality.",
                        "agent": agent_id
                    }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
                return
        
        # Serve static files
        super().do_GET()
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data)
        except:
            data = {}
        
        if self.path == '/api/signup':
            company = data.get('company', '')
            email = data.get('email', '')
            api_key = 'gk_' + os.urandom(8).hex()
            
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("INSERT INTO users (company, email, api_key, created_at) VALUES (?, ?, ?, ?)",
                     (company, email, api_key, datetime.now().isoformat()))
            conn.commit()
            user_id = c.lastrowid
            conn.close()
            
            # Send welcome email if mailgun available
            if MAILGUN_AVAILABLE:
                try:
                    mailgun.send_email(
                        "Sarah Chen",
                        email,
                        "Welcome to Genii AI!",
                        f"Hi! I'm Sarah, your AI Content Manager. Welcome to {company}! I'm excited to help you grow your business. Reply to this email anytime!"
                    )
                except Exception as e:
                    print(f"[MAIL] Could not send welcome email: {e}")
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "company_id": user_id,
                "api_key": api_key,
                "message": "User created successfully"
            }).encode())
            return
            
        elif self.path == '/api/hire':
            user_id = data.get('user_id')
            agent_id = data.get('agent_id')
            agent_name = data.get('agent_name')
            
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("INSERT INTO agents (user_id, agent_id, agent_name, hired_at) VALUES (?, ?, ?, ?)",
                     (user_id, agent_id, agent_name, datetime.now().isoformat()))
            conn.commit()
            
            # Get user email
            c.execute("SELECT email FROM users WHERE id = ?", (user_id,))
            user_email = c.fetchone()[0] if c.fetchone() else None
            conn.close()
            
            # Send introduction email
            if MAILGUN_AVAILABLE and user_email:
                try:
                    mailgun.send_email(
                        agent_name,
                        user_email,
                        f"Hi from {agent_name}! Let's get started",
                        f"Hi! I'm {agent_name}, your new AI {agent_id}. I'm excited to work with you! Reply to this email with your first task."
                    )
                except Exception as e:
                    print(f"[MAIL] Could not send hire email: {e}")
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "message": f"Hired {agent_name}"}).encode())
            return
            
        elif self.path == '/api/chat':
            user_email = data.get('email')
            agent_id = data.get('agent_id')
            message = data.get('message')
            
            # Get agent response
            if OPENCLAW_AVAILABLE:
                response = openclaw_bridge.send_message_to_agent(agent_id, message)
                response_text = response.get('content', 'Sorry, I could not process that.')
            else:
                response_text = f"Hi! This is {agent_id}. I received your message: '{message}'. I'm ready to help! (Note: Full AI integration requires OpenClaw configuration)"
            
            # Store conversation
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("INSERT INTO conversations (user_email, agent_id, message, response, created_at) VALUES (?, ?, ?, ?, ?)",
                     (user_email, agent_id, message, response_text, datetime.now().isoformat()))
            conn.commit()
            conn.close()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "response": response_text,
                "agent": agent_id
            }).encode())
            return
        
        self.send_response(404)
        self.end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

PORT = 8080
print(f"?? Genii AI Platform starting on port {PORT}")
print(f"?? Database: {DB_PATH}")
print(f"?? OpenClaw: {'Connected' if OPENCLAW_AVAILABLE else 'Not available'}")
print(f"?? Mailgun: {'Connected' if MAILGUN_AVAILABLE else 'Not available'}")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"? Server running at http://localhost:{PORT}")
    httpd.serve_forever()
