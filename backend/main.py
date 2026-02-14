from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from backend.routers import (
    stripe,
    outreach, sales, pricing, clickup, content, 
    provision, industrial, google, reports, 
    marketplace, affiliate, revenue
)
from backend.utils.discovery import discovery
import os

app = FastAPI(
    title="Genii Enterprise ERP",
    description="The Autonomous Enterprise Core",
    version="2.0.1",
)

# Mount static files for dashboard
if os.path.exists("frontend"):
    app.mount("/static", StaticFiles(directory="frontend"), name="static")

# Register Routers
app.include_router(outreach.router)
app.include_router(sales.router)
app.include_router(pricing.router)
app.include_router(clickup.router)
app.include_router(content.router)
app.include_router(provision.router)
app.include_router(industrial.router)
app.include_router(google.router)
app.include_router(reports.router)
app.include_router(marketplace.router)
app.include_router(affiliate.router)
app.include_router(revenue.router)
app.include_router(stripe.router)

# CORS - Allow dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "operational", "system": "Genii ERP v2"}

@app.get("/")
def root():
    return {"message": "Welcome to the Autonomous Enterprise Core", "dashboard": "/dashboard"}

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Genii ERP Dashboard</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; background: #0f0f23; color: #fff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 32px; }
            .header p { margin: 10px 0 0 0; opacity: 0.8; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .card { background: #1a1a2e; padding: 20px; border-radius: 10px; border: 1px solid #2a2a4e; }
            .card h3 { margin-top: 0; color: #9178b4; }
            .metric { font-size: 36px; font-weight: bold; color: #4ade80; margin: 10px 0; }
            .metric-label { color: #888; font-size: 14px; }
            .links { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; }
            .link-btn { background: #667eea; color: white; padding: 8px 16px; border-radius: 5px; text-decoration: none; font-size: 14px; }
            .link-btn:hover { background: #764ba2; }
            .status { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #4ade80; margin-right: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #2a2a4e; }
            th { color: #9178b4; font-weight: 600; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>????? Genii Enterprise ERP</h1>
            <p><span class="status"></span>System Operational | Version 2.0.1</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>?? Revenue Status</h3>
                <div class="metric">$0.00</div>
                <div class="metric-label">No sales recorded yet</div>
                <div class="links">
                    <a href="/marketplace/tiers" class="link-btn">View Pricing</a>
                    <a href="/revenue/dashboard" class="link-btn">Revenue API</a>
                </div>
            </div>
            
            <div class="card">
                <h3>?? Active Agents</h3>
                <div class="metric">17</div>
                <div class="metric-label">Cloudflare Workers Deployed</div>
                <div class="links">
                    <a href="/outreach/stats" class="link-btn">Outreach Stats</a>
                    <a href="/sales/leads" class="link-btn">Sales Leads</a>
                </div>
            </div>
            
            <div class="card">
                <h3>?? Affiliate Links</h3>
                <div class="metric-label">Configure affiliate partnerships</div>
                <div class="links">
                    <a href="/marketplace/affiliates" class="link-btn">View Links</a>
                    <a href="/affiliate/rewrite?url=https://example.com" class="link-btn">Test Rewrite</a>
                </div>
            </div>
            
            <div class="card">
                <h3>?? Quick Actions</h3>
                <div class="links">
                    <a href="/marketplace/demo-purchase" class="link-btn">Demo Purchase</a>
                    <a href="/content/queue" class="link-btn">Content Queue</a>
                    <a href="/clickup/tasks?list_id=123" class="link-btn">ClickUp Tasks</a>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3>?? API Endpoints</h3>
            <table>
                <tr><th>Endpoint</th><th>Description</th><th>Method</th></tr>
                <tr><td>/health</td><td>System health check</td><td>GET</td></tr>
                <tr><td>/marketplace/tiers</td><td>View subscription tiers</td><td>GET</td></tr>
                <tr><td>/marketplace/purchase</td><td>Process a purchase</td><td>POST</td></tr>
                <tr><td>/sales/leads</td><td>View hot leads</td><td>GET</td></tr>
                <tr><td>/outreach/campaigns</td><td>Create outreach campaign</td><td>POST</td></tr>
                <tr><td>/content/generate</td><td>Generate content campaign</td><td>POST</td></tr>
                <tr><td>/affiliate/fulfillment</td><td>Process fulfillment</td><td>POST</td></tr>
                <tr><td>/revenue/dashboard</td><td>Revenue dashboard (JSON)</td><td>GET</td></tr>
            </table>
        </div>
        
        <div class="card">
            <h3>?? Custom Domain Setup</h3>
            <p>To access via geniinow.com, configure:</p>
            <ul>
                <li>DNS A record: geniinow.com ? YOUR_SERVER_IP</li>
                <li>Or CNAME: geniinow.com ? your-subdomain.railway.app</li>
            </ul>
            <div class="links">
                <a href="https://dash.cloudflare.com" class="link-btn" target="_blank">Cloudflare Dashboard</a>
            </div>
        </div>
    </body>
    </html>
    """
    return html_content
