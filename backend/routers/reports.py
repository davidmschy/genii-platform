from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..utils.db import get_db
import uuid
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/reports",
    tags=["reports"],
)

@router.post("/generate")
async def generate_report(title: str, data: dict):
    """
    Creates a new ephemeral report token.
    The frontend uses this token to render a custom report site.
    """
    report_id = str(uuid.uuid4())
    # In production, save to DB with expiry
    return {
        "report_id": report_id,
        "url": f"http://localhost:3000/reports/{report_id}",
        "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat(),
        "password": str(uuid.uuid4())[:8] # Basic password protection
    }

@router.get("/{report_id}")
async def get_report_data(report_id: str):
    """
    Fetches the interactive data for a specific report.
    """
    # Mock data for demonstration
    return {
        "title": "Quarterly ROI Analysis",
        "client": "Enterprise Partner A",
        "metrics": {
            "net_profit": "$452,000",
            "efficiency_gain": "34%",
            "autonomous_actions": 1240
        },
        "charts": [
            {"label": "Jan", "value": 400},
            {"label": "Feb", "value": 700},
            {"label": "Mar", "value": 1200}
        ]
    }
