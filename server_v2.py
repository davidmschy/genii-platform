import http.server
import socketserver
import json
import sqlite3
import os
import random
from datetime import datetime
from urllib.parse import parse_qs

DB_PATH = os.path.join(os.path.dirname(__file__), 'genii.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY, company TEXT, email TEXT, phone TEXT, 
                  api_key TEXT, onboarded INTEGER DEFAULT 0, created_at TEXT)''')
    
    # AI Employees table (pre-populated C-suite + departments)
    c.execute('''CREATE TABLE IF NOT EXISTS ai_employees
                 (id INTEGER PRIMARY KEY, user_id INTEGER, agent_id TEXT, agent_name TEXT,
                  role TEXT, department TEXT, avatar TEXT, hourly_rate REAL,
                  status TEXT, capabilities TEXT, email TEXT, phone TEXT,
                  reports_to TEXT, direct_reports INTEGER DEFAULT 0,
                  tasks_completed INTEGER DEFAULT 0, hours_worked REAL DEFAULT 0,
                  hired_at TEXT, last_active TEXT)''')
    
    # Org chart relationships
    c.execute('''CREATE TABLE IF NOT EXISTS org_chart
                 (id INTEGER PRIMARY KEY, user_id INTEGER, 
                  employee_id TEXT, manager_id TEXT, level INTEGER)''')
    
    # Tasks/Activity
    c.execute('''CREATE TABLE IF NOT EXISTS tasks
                 (id INTEGER PRIMARY KEY, user_id INTEGER, employee_id TEXT,
                  title TEXT, description TEXT, status TEXT, priority TEXT,
                  created_at TEXT, completed_at TEXT)''')
    
    # Conversations
    c.execute('''CREATE TABLE IF NOT EXISTS conversations
                 (id INTEGER PRIMARY KEY, user_id INTEGER, employee_id TEXT,
                  message TEXT, response TEXT, channel TEXT, created_at TEXT)''')
    
    conn.commit()
    conn.close()

init_db()

# Pre-defined AI employee templates
C_SUITE = [
    {
        'agent_id': 'genii-exec',
        'agent_name': 'Genii',
        'role': 'Executive Assistant',
        'department': 'Executive',
        'avatar': '??',
        'hourly_rate': 5.00,
        'reports_to': None,
        'capabilities': ['onboarding', 'executive_support', 'coordination', 'strategy'],
        'bio': 'Your personal AI executive assistant. I know everything about your business and life.'
    },
    {
        'agent_id': 'ceo-ai',
        'agent_name': 'Alexander',
        'role': 'CEO',
        'department': 'Executive',
        'avatar': '?????',
        'hourly_rate': 10.00,
        'reports_to': 'user',
        'capabilities': ['strategic_planning', 'vision', 'leadership', 'decisions'],
        'bio': 'Chief Executive Officer. Sets vision, makes strategic decisions, leads the company.'
    },
    {
        'agent_id': 'cfo-ai',
        'agent_name': 'Victoria',
        'role': 'CFO',
        'department': 'Finance',
        'avatar': '?????',
        'hourly_rate': 8.00,
        'reports_to': 'ceo-ai',
        'capabilities': ['accounting', 'budgeting', 'forecasting', 'investor_relations'],
        'bio': 'Chief Financial Officer. Manages finances, cash flow, and financial strategy.'
    },
    {
        'agent_id': 'cmo-ai',
        'agent_name': 'Marcus',
        'role': 'CMO',
        'department': 'Marketing',
        'avatar': '??',
        'hourly_rate': 7.00,
        'reports_to': 'ceo-ai',
        'capabilities': ['marketing_strategy', 'branding', 'growth', 'analytics'],
        'bio': 'Chief Marketing Officer. Drives growth, brand, and customer acquisition.'
    },
    {
        'agent_id': 'cto-ai',
        'agent_name': 'Elena',
        'role': 'CTO',
        'department': 'Technology',
        'avatar': '??',
        'hourly_rate': 8.00,
        'reports_to': 'ceo-ai',
        'capabilities': ['engineering', 'architecture', 'security', 'infrastructure'],
        'bio': 'Chief Technology Officer. Leads technology, engineering, and product development.'
    },
    {
        'agent_id': 'coo-ai',
        'agent_name': 'Richard',
        'role': 'COO',
        'department': 'Operations',
        'avatar': '??',
        'hourly_rate': 7.00,
        'reports_to': 'ceo-ai',
        'capabilities': ['operations', 'processes', 'logistics', 'scaling'],
        'bio': 'Chief Operating Officer. Runs day-to-day operations and execution.'
    }
]

DEPARTMENTS = {
    'Finance': [
        {'agent_id': 'acct-sarah', 'name': 'Sarah', 'role': 'Senior Accountant', 'rate': 3.00, 'avatar': '??'},
        {'agent_id': 'book-lisa', 'name': 'Lisa', 'role': 'Bookkeeper', 'rate': 2.00, 'avatar': '??'},
        {'agent_id': 'payroll-mike', 'name': 'Mike', 'role': 'Payroll Manager', 'rate': 2.50, 'avatar': '??'},
    ],
    'Sales': [
        {'agent_id': 'sales-john', 'name': 'John', 'role': 'Sales Director', 'rate': 4.00, 'avatar': '??'},
        {'agent_id': 'sdr-alex', 'name': 'Alex', 'role': 'Sales Development Rep', 'rate': 2.00, 'avatar': '??'},
        {'agent_id': 'ae-maria', 'name': 'Maria', 'role': 'Account Executive', 'rate': 3.50, 'avatar': '??'},
        {'agent_id': 'cs-james', 'name': 'James', 'role': 'Customer Success', 'rate': 2.50, 'avatar': '??'},
    ],
    'Marketing': [
        {'agent_id': 'content-taylor', 'name': 'Taylor', 'role': 'Content Manager', 'rate': 2.50, 'avatar': '??'},
        {'agent_id': 'social-jordan', 'name': 'Jordan', 'role': 'Social Media Manager', 'rate': 2.00, 'avatar': '??'},
        {'agent_id': 'seo-pat', 'name': 'Pat', 'role': 'SEO Specialist', 'rate': 3.00, 'avatar': '??'},
        {'agent_id': 'ads-casey', 'name': 'Casey', 'role': 'Paid Ads Manager', 'rate': 3.50, 'avatar': '??'},
    ],
    'Technology': [
        {'agent_id': 'dev-david', 'name': 'David', 'role': 'Senior Developer', 'rate': 4.00, 'avatar': '?????'},
        {'agent_id': 'dev-sam', 'name': 'Sam', 'role': 'Full Stack Developer', 'rate': 3.50, 'avatar': '??'},
        {'agent_id': 'qa-alexis', 'name': 'Alexis', 'role': 'QA Engineer', 'rate': 2.50, 'avatar': '??'},
        {'agent_id': 'devops-ryan', 'name': 'Ryan', 'role': 'DevOps Engineer', 'rate': 4.00, 'avatar': '??'},
    ],
    'Operations': [
        {'agent_id': 'ops-morgan', 'name': 'Morgan', 'role': 'Operations Manager', 'rate': 3.00, 'avatar': '??'},
        {'agent_id': 'admin-kim', 'name': 'Kim', 'role': 'Admin Assistant', 'rate': 1.50, 'avatar': '??'},
        {'agent_id': 'hr-jessica', 'name': 'Jessica', 'role': 'HR Manager', 'rate': 2.50, 'avatar': '??'},
    ],
    'Legal': [
        {'agent_id': 'legal-robert', 'name': 'Robert', 'role': 'Legal Counsel', 'rate': 5.00, 'avatar': '??'},
        {'agent_id': 'compliance-anna', 'name': 'Anna', 'role': 'Compliance Officer', 'rate': 4.00, 'avatar': '??'},
    ]
}

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # API endpoints
        if self.path == '/api/health':
            self.send_json({"status": "healthy", "version": "2.0.0", "time": datetime.now().isoformat()})
            return
            
        elif self.path == '/api/dashboard':
            user_id = self.get_user_id()
            if user_id:
                dashboard = self.get_dashboard(user_id)
                self.send_json(dashboard)
            else:
                self.send_json({"error": "Unauthorized"}, 401)
            return
            
        elif self.path == '/api/org-chart':
            user_id = self.get_user_id()
            if user_id:
                chart = self.get_org_chart(user_id)
                self.send_json(chart)
            else:
                self.send_json({"error": "Unauthorized"}, 401)
            return
            
        elif self.path == '/api/employees':
            user_id = self.get_user_id()
            if user_id:
                employees = self.get_employees(user_id)
                self.send_json(employees)
            else:
                self.send_json({"error": "Unauthorized"}, 401)
            return
            
        elif self.path == '/api/executive-summary':
            user_id = self.get_user_id()
            if user_id:
                summary = self.get_executive_summary(user_id)
                self.send_json(summary)
            else:
                self.send_json({"error": "Unauthorized"}, 401)
            return
        
        # Serve static files
        super().do_GET()
    
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
            
        elif self.path == '/api/onboard':
            self.handle_onboard(data)
            return
            
        elif self.path == '/api/message':
            self.handle_message(data)
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
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Create user
        c.execute("""INSERT INTO users (company, email, phone, api_key, onboarded, created_at) 
                     VALUES (?, ?, ?, ?, 0, ?)""",
                 (company, email, phone, api_key, datetime.now().isoformat()))
        user_id = c.lastrowid
        
        # Create C-suite for this user
        for executive in C_SUITE:
            c.execute("""INSERT INTO ai_employees 
                        (user_id, agent_id, agent_name, role, department, avatar, hourly_rate,
                         status, capabilities, reports_to, hired_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)""",
                     (user_id, executive['agent_id'], executive['agent_name'],
                      executive['role'], executive['department'], executive['avatar'],
                      executive['hourly_rate'], json.dumps(executive['capabilities']),
                      executive['reports_to'], datetime.now().isoformat()))
        
        # Create department teams
        dept_count = 0
        for dept_name, team in DEPARTMENTS.items():
            for member in team[:3]:  # Add first 3 of each dept
                c.execute("""INSERT INTO ai_employees 
                            (user_id, agent_id, agent_name, role, department, avatar, hourly_rate,
                             status, capabilities, reports_to, hired_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)""",
                         (user_id, member['agent_id'], member['name'],
                          member['role'], dept_name, member['avatar'],
                          member['rate'], json.dumps(['task_execution']),
                          None, datetime.now().isoformat()))
                dept_count += 1
        
        conn.commit()
        conn.close()
        
        # Return welcome package
        self.send_json({
            "success": True,
            "message": "Welcome to Genii Enterprises",
            "company_id": user_id,
            "api_key": api_key,
            "executive_count": len(C_SUITE),
            "workforce_count": len(C_SUITE) + dept_count,
            "next_steps": [
                "Check your phone for welcome message from Genii",
                "Access your executive dashboard",
                "Meet your C-suite team",
                "Begin onboarding process"
            ],
            "dashboard_url": f"/dashboard?key={api_key}"
        })
    
    def handle_onboard(self, data):
        user_id = data.get('user_id')
        preferences = data.get('preferences', {})
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("UPDATE users SET onboarded = 1 WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()
        
        self.send_json({
            "success": True,
            "message": "Onboarding complete",
            "genii_message": "I'm Genii, your executive assistant. I now have 47 AI employees ready to work for you. What would you like to accomplish first?"
        })
    
    def handle_message(self, data):
        user_id = data.get('user_id')
        employee_id = data.get('employee_id')
        message = data.get('message', '')
        
        # Simulate AI response
        responses = {
            'genii-exec': f"I'm on it. I'll coordinate with the team and get back to you within the hour. Is there anything else you need?",
            'ceo-ai': "From a strategic perspective, I recommend we prioritize this initiative. I'll have the team prepare a detailed plan.",
            'cfo-ai': "I've reviewed the numbers. This fits within our budget and projected ROI looks strong.",
            'cmo-ai': "Great marketing opportunity. I'll have Jordan start on the campaign and Casey prepare the ad spend.",
        }
        
        response = responses.get(employee_id, "I'm on it. I'll get this done for you.")
        
        # Store conversation
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""INSERT INTO conversations 
                    (user_id, employee_id, message, response, channel, created_at)
                    VALUES (?, ?, ?, ?, 'web', ?)""",
                 (user_id, employee_id, message, response, datetime.now().isoformat()))
        conn.commit()
        conn.close()
        
        self.send_json({
            "success": True,
            "response": response,
            "employee_id": employee_id,
            "timestamp": datetime.now().isoformat()
        })
    
    def get_dashboard(self, user_id):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Get counts
        c.execute("SELECT COUNT(*) FROM ai_employees WHERE user_id = ?", (user_id,))
        total_employees = c.fetchone()[0]
        
        c.execute("SELECT COUNT(*) FROM ai_employees WHERE user_id = ? AND department = 'Executive'", (user_id,))
        c_suite_count = c.fetchone()[0]
        
        c.execute("SELECT SUM(tasks_completed) FROM ai_employees WHERE user_id = ?", (user_id,))
        tasks_completed = c.fetchone()[0] or 0
        
        c.execute("SELECT SUM(hours_worked) FROM ai_employees WHERE user_id = ?", (user_id,))
        hours_worked = c.fetchone()[0] or 0
        
        # Get recent activity
        c.execute("""SELECT e.agent_name, e.role, e.avatar, e.hourly_rate, e.status
                    FROM ai_employees e WHERE e.user_id = ? AND e.department = 'Executive'
                    ORDER BY e.hourly_rate DESC""", (user_id,))
        executives = [{"name": row[0], "role": row[1], "avatar": row[2], "rate": row[3], "status": row[4]} 
                      for row in c.fetchall()]
        
        conn.close()
        
        return {
            "company_stats": {
                "total_employees": total_employees,
                "c_suite_count": c_suite_count,
                "tasks_completed": tasks_completed,
                "hours_worked": hours_worked,
                "monthly_budget": total_employees * 40 * 3  # 40 hours * $3 avg
            },
            "executives": executives,
            "departments": list(DEPARTMENTS.keys()),
            "quick_actions": [
                "Message CEO",
                "Review Financials",
                "Check Marketing Campaigns",
                "View Engineering Progress"
            ]
        }
    
    def get_org_chart(self, user_id):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""SELECT agent_id, agent_name, role, department, avatar, hourly_rate, reports_to
                    FROM ai_employees WHERE user_id = ? ORDER BY department, hourly_rate DESC""", (user_id,))
        
        employees = []
        for row in c.fetchall():
            employees.append({
                "id": row[0],
                "name": row[1],
                "role": row[2],
                "department": row[3],
                "avatar": row[4],
                "rate": row[5],
                "reports_to": row[6]
            })
        
        conn.close()
        return {"employees": employees, "hierarchy": "user -> CEO -> C-Suite -> Departments"}
    
    def get_employees(self, user_id):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""SELECT agent_id, agent_name, role, department, avatar, hourly_rate, status,
                    tasks_completed, hours_worked
                    FROM ai_employees WHERE user_id = ? ORDER BY department, hourly_rate DESC""", (user_id,))
        
        employees = []
        for row in c.fetchall():
            employees.append({
                "id": row[0],
                "name": row[1],
                "role": row[2],
                "department": row[3],
                "avatar": row[4],
                "hourly_rate": row[5],
                "status": row[6],
                "tasks_completed": row[7],
                "hours_worked": row[8]
            })
        
        conn.close()
        return {"employees": employees, "count": len(employees)}
    
    def get_executive_summary(self, user_id):
        return {
            "title": "Chairman's Daily Brief",
            "date": datetime.now().strftime("%B %d, %Y"),
            "highlights": [
                "All 6 C-suite executives active and reporting",
                "23 department employees ready for assignment",
                "No urgent items requiring your attention",
                "Genii has prepared onboarding briefing"
            ],
            "recommendations": [
                "Schedule 15-min intro call with CEO Alexander",
                "Review financial projections with CFO Victoria",
                "Discuss marketing initiatives with CMO Marcus"
            ]
        }
    
    def get_user_id(self):
        # Simple auth from query param
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        if 'key' in params:
            api_key = params['key'][0]
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("SELECT id FROM users WHERE api_key = ?", (api_key,))
            result = c.fetchone()
            conn.close()
            if result:
                return result[0]
        return None
    
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
print("?? GENII ENTERPRISES PLATFORM v2.0")
print(f"?? Starting Chairman's Dashboard on port {PORT}")
print("?? Pre-loaded with 47 AI employees")
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"? Platform ready at http://localhost:{PORT}")
    httpd.serve_forever()

