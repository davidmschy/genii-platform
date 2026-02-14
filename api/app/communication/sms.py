import os
from twilio.rest import Client

class SMSAdapter:
    """Twilio SMS integration for agent phone numbers"""
    
    def __init__(self):
        self.client = Client(
            os.getenv("TWILIO_ACCOUNT_SID"),
            os.getenv("TWILIO_AUTH_TOKEN")
        )
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER")
    
    async def send_message(self, to_number: str, body: str) -> dict:
        """Send SMS as agent"""
        message = self.client.messages.create(
            body=body,
            from_=self.from_number,
            to=to_number
        )
        return {"message_sid": message.sid, "status": message.status}
    
    async def receive_webhook(self, payload: dict) -> dict:
        """Process incoming SMS webhook"""
        return {
            "from": payload.get("From"),
            "to": payload.get("To"),
            "body": payload.get("Body"),
            "message_sid": payload.get("MessageSid")
        }
