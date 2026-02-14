import os
from typing import Optional
import requests

class EmailAdapter:
    """Mailgun email integration for agent identities"""
    
    def __init__(self):
        self.api_key = os.getenv("MAILGUN_API_KEY")
        self.domain = os.getenv("MAILGUN_DOMAIN", "geniiai.com")
        self.base_url = f"https://api.mailgun.net/v3/{self.domain}"
    
    async def send_message(
        self,
        from_agent: str,
        to_email: str,
        subject: str,
        body: str,
        reply_to: Optional[str] = None
    ) -> dict:
        """Send email as agent"""
        data = {
            "from": f"{from_agent} <{from_agent.lower().replace(' ', '.')}@geniiai.com>",
            "to": to_email,
            "subject": subject,
            "text": body,
        }
        if reply_to:
            data["h:Reply-To"] = reply_to
        
        response = requests.post(
            f"{self.base_url}/messages",
            auth=("api", self.api_key),
            data=data
        )
        return {"message_id": response.json().get("id"), "status": "sent"}
    
    async def receive_webhook(self, payload: dict) -> dict:
        """Process incoming email webhook"""
        return {
            "from": payload.get("sender"),
            "to": payload.get("recipient"),
            "subject": payload.get("subject"),
            "body": payload.get("body-plain"),
            "timestamp": payload.get("timestamp")
        }
