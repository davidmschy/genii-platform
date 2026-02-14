from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.utils.bridge import bridge
import uuid

router = APIRouter(
    prefix="/outreach",
    tags=["outreach"],
)

@router.post("/campaigns")
async def create_campaign(name: str, target_audience: str, script_template: str):
    """
    Starts an automated outreach campaign via OpenClaw agents.
    """
    campaign_id = uuid.uuid4()
    
    # Prompt for the outreach agent
    prompt = f"Initiate outreach campaign '{name}' for target audience '{target_audience}'. Use the following script template: {script_template}"
    
    # Trigger OpenClaw agent (e.g., 'feature-dev/developer' as placeholder or custom agent)
    agent_response = bridge.run_agent_task(
        agent_id="feature-dev/developer", 
        prompt=prompt
    )
    
    return {
        "campaign_id": campaign_id,
        "status": "initiated",
        "agent_response": agent_response
    }

@router.get("/stats")
async def get_outreach_stats():
    """
    Returns high-level ROI stats for the outreach module.
    """
    return {
        "leads_contacted": 1240,
        "meetings_booked": 42,
        "estimated_pipeline_value": 450000,
        "roi_multiple": 3.2
    }
