from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.base import get_db

router = APIRouter()

@router.get("/discover")
async def discover(db: Session = Depends(get_db)):
    return {
        "name": "Genii AI Workforce API",
        "version": "1.0.0",
        "_links": {
            "agents": {"href": "/api/v1/agents", "method": "GET"},
            "companies": {"href": "/api/v1/companies", "method": "GET"},
            "messages": {"href": "/api/v1/messages", "method": "POST"},
        },
        "modules": [
            {"name": "finance", "status": "active"},
            {"name": "crm", "status": "active"},
            {"name": "helpdesk", "status": "beta"},
        ]
    }
