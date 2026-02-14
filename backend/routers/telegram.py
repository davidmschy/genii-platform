from fastapi import APIRouter, Request, HTTPException
import os
import requests
from ..utils.bridge import bridge

router = APIRouter(
    prefix="/telegram",
    tags=["telegram"],
)

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
BASE_URL = f"https://api.telegram.org/bot{TOKEN}"

@router.post("/webhook")
async def telegram_webhook(request: Request):
    """
    Receives updates from Telegram.
    """
    data = await request.json()
    
    if "message" in data:
        chat_id = data["message"]["chat"]["id"]
        text = data["message"].get("text", "")
        user = data["message"].get("from", {}).get("username", "Unknown")
        
        print(f"Telegram message from {user}: {text}")
        
        # Forward to OpenClaw
        agent_response = bridge.run_agent_task(
            agent_id="personal-assistant",
            prompt=f"Telegram message from {user}: {text}"
        )
        
        response_text = agent_response.get("response", "I'm on it.")
        
        # Send reply back to Telegram
        send_message(chat_id, response_text)
        
    return {"status": "ok"}

def send_message(chat_id: int, text: str):
    url = f"{BASE_URL}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text
    }
    try:
        requests.post(url, json=payload, timeout=10)
    except Exception as e:
        print(f"Failed to send Telegram message: {e}")

@router.get("/setup")
def setup_webhook(url: str):
    """
    Helper to set the Telegram webhook URL.
    """
    webhook_url = f"{url}/telegram/webhook"
    res = requests.get(f"{BASE_URL}/setWebhook?url={webhook_url}")
    return res.json()
