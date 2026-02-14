import requests
import os
from datetime import datetime

class TwilioClient:
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.messaging_service_sid = os.getenv('TWILIO_MESSAGING_SERVICE_SID')
        self.base_url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}"
    
    def send_sms(self, to_number, body, from_number=None):
        """Send SMS via Twilio"""
        if not self.account_sid or not self.auth_token:
            return {"success": False, "error": "Twilio not configured"}
        
        url = f"{self.base_url}/Messages.json"
        
        data = {
            'To': to_number,
            'Body': body
        }
        
        # Use Messaging Service if available, otherwise use from number
        if self.messaging_service_sid:
            data['MessagingServiceSid'] = self.messaging_service_sid
        elif from_number:
            data['From'] = from_number
        else:
            return {"success": False, "error": "No sender configured"}
        
        try:
            response = requests.post(
                url,
                data=data,
                auth=(self.account_sid, self.auth_token),
                timeout=10
            )
            
            if response.status_code == 201:
                result = response.json()
                return {
                    "success": True,
                    "message_sid": result.get('sid'),
                    "status": result.get('status')
                }
            else:
                return {
                    "success": False,
                    "error": response.text,
                    "status_code": response.status_code
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def send_welcome_message(self, user_phone, user_name, company_name):
        """Send welcome SMS to new user"""
        message = f"""?? Welcome to Genii Enterprises, {user_name}!

I'm Genii, your AI Executive Assistant. Your company '{company_name}' now has 47 AI employees ready to work.

Your C-Suite is standing by:
• Alexander (CEO) - Strategy
• Victoria (CFO) - Finance  
• Marcus (CMO) - Marketing
• Elena (CTO) - Technology
• Richard (COO) - Operations

Access your dashboard: https://interactions-year-cancel-technological.trycloudflare.com

Reply HELP for assistance or START to begin onboarding.
"""
        return self.send_sms(user_phone, message)
    
    def send_agent_introduction(self, user_phone, agent_name, agent_role):
        """Send introduction from hired agent"""
        message = f"""?? Hi! I'm {agent_name}, your new {agent_role}.

I'm excited to join your team at Genii Enterprises! I'm ready to help you grow your business 24/7.

What would you like me to work on first?

Reply with your first task or question.
"""
        return self.send_sms(user_phone, message)
    
    def send_executive_briefing(self, user_phone):
        """Send daily executive briefing"""
        message = f"""?? Chairman's Daily Brief - {datetime.now().strftime('%B %d')}

All systems operational:
? 47 AI employees active
? C-Suite reporting ready
? No urgent items

Today's recommendation: Schedule intro call with CEO Alexander to discuss your vision.

Reply BRIEF for full report or CALL to schedule.
"""
        return self.send_sms(user_phone, message)

# Global instance
twilio = TwilioClient()
