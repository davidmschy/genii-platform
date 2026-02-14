import requests
import os

class MailgunClient:
    def __init__(self):
        self.api_key = os.getenv('MAILGUN_API_KEY')
        self.domain = os.getenv('MAILGUN_DOMAIN', 'geniiai.com')
        self.base_url = f"https://api.mailgun.net/v3/{self.domain}"
    
    def send_email(self, from_agent, to_email, subject, body):
        """Send email as an AI agent"""
        if not self.api_key:
            print(f"[MAILGUN] Would send email from {from_agent} to {to_email}")
            return {"status": "simulated", "message": "Mailgun not configured"}
        
        agent_email = f"{from_agent.lower().replace(' ', '.')}@{self.domain}"
        
        data = {
            "from": f"{from_agent} <{agent_email}>",
            "to": to_email,
            "subject": subject,
            "text": body
        }
        
        response = requests.post(
            f"{self.base_url}/messages",
            auth=("api", self.api_key),
            data=data
        )
        
        return response.json()
    
    def setup_webhook(self, url):
        """Setup webhook to receive emails"""
        if not self.api_key:
            return {"status": "error", "message": "No API key"}
        
        data = {
            "url": url,
            "events": "received"
        }
        
        response = requests.post(
            f"{self.base_url}/routes",
            auth=("api", self.api_key),
            data=data
        )
        
        return response.json()

# Global instance
mailgun = MailgunClient()
