from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.utils.bridge import bridge
import uuid
import os

router = APIRouter(
    prefix="/clickup",
    tags=["clickup"],
)

@router.get("/tasks")
async def get_click_tasks(list_id: str = None):
    """
    Fetches tasks from ClickUp.
    """
    # In a real impl, this would call ClickUp API directly or via an Agent
    prompt = f"List all active tasks from ClickUp list {list_id if list_id else 'default'}."
    
    agent_response = bridge.run_agent_task(
        agent_id="feature-dev/developer", 
        prompt=prompt
    )
    
    return {
        "status": "fetching",
        "agent_response": agent_response
    }

@router.post("/task")
async def create_click_task(name: str, description: str, list_id: str):
    """
    Creates a new task in ClickUp.
    """
    prompt = f"Create a new ClickUp task named '{name}' with description: {description} in list {list_id}."
    
    agent_response = bridge.run_agent_task(
        agent_id="feature-dev/developer",
        prompt=prompt
    )
    
    return {
        "status": "task_creation_initiated",
        "agent_response": agent_response
    }
