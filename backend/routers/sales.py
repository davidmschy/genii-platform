from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..utils.bridge import bridge
import uuid

router = APIRouter(
    prefix="/sales",
    tags=["sales"],
)

@router.get("/leads")
async def get_hot_leads():
    """
    Returns leads that are ready to be closed.
    """
    return [
        {"id": 1, "name": "Global Tech Corp", "value": 500000, "probability": 0.85},
        {"id": 2, "name": "Innovate Ltd", "value": 250000, "probability": 0.70},
    ]

@router.post("/close/{lead_id}")
async def close_deal(lead_id: int):
    """
    Triggers the Sales Closer agent to finalize the contract.
    """
    prompt = f"Finalize the contract and close the deal for lead ID {lead_id}. Focus on ROI and system autonomy."
    
    agent_response = bridge.run_agent_task(
        agent_id="feature-dev/developer", # Placeholder
        prompt=prompt
    )
    
    return {
        "lead_id": lead_id,
        "status": "closing_initiated",
        "agent_response": agent_response
    }
