from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.utils.bridge import bridge
import uuid

router = APIRouter(
    prefix="/content",
    tags=["content"],
)

@router.post("/generate")
async def generate_campaign(brand: str, objective: str):
    """
    Triggers agents to generate a full content campaign (Social, Blog, Ads).
    """
    prompt = f"Create a full autonomous content campaign for brand '{brand}' with objective: {objective}."
    
    agent_response = bridge.run_agent_task(
        agent_id="feature-dev/developer", 
        prompt=prompt
    )
    
    return {
        "campaign_id": uuid.uuid4(),
        "status": "generation_started",
        "agent_response": agent_response
    }

@router.get("/queue")
async def get_content_queue():
    """
    Returns the scheduled posts and campaigns.
    """
    return [
        {"id": 1, "brand": "Genii", "type": "Social", "date": "2026-02-12", "status": "scheduled"},
        {"id": 2, "brand": "Genii", "type": "Blog", "date": "2026-02-13", "status": "drafting"}
    ]
