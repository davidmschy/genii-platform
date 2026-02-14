from fastapi import APIRouter, Request, HTTPException
from ..utils.google_auth import google_auth
from ..utils.bridge import bridge
import json

router = APIRouter(
    prefix="/google",
    tags=["google"],
)

@router.post("/chat/webhook")
async def chat_webhook(request: Request):
    """
    Receives events from Google Chat (Mentions in Spaces).
    """
    event = await request.json()
    
    # Verify events from Google (In production, use token verification)
    if event.get('type') == 'MESSAGE':
        message = event.get('message', {})
        text = message.get('text', '')
        space_id = event.get('space', {}).get('name')
        user_name = event.get('user', {}).get('displayName')
        
        print(f"Google Chat: Received from {user_name} in {space_id}: {text}")
        
        # Route to OpenClaw
        response = bridge.run_agent_task(
            agent_id="enterprise-admin", # Default agent for team ops
            prompt=f"Message from {user_name} on Google Chat: {text}"
        )
        
        return {
            "text": f"Genii: Processing your request... \n {response.get('result', 'Task queued.')}"
        }
    
    return {"status": "ignored"}
