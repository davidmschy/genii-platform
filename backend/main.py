from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from backend.routers import (
    stripe, outreach, sales, pricing, clickup, content, 
    provision, industrial, google, reports, 
    marketplace, affiliate, revenue
)
import os

app = FastAPI(
    title="Genii Enterprise ERP",
    description="The Autonomous Enterprise Core",
    version="2.0.1",
)

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
    return {"message": "Welcome to Genii Enterprise Core", "dashboard": "/dashboard"}

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard():
    template_path = os.path.join(os.path.dirname(__file__), "templates", "dashboard.html")
    with open(template_path, "r") as f:
        return f.read()
