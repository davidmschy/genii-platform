import requests
import os
import json

class OpenClawBridge:
    """Bridge between Genii Platform and OpenClaw agents"""
    
    def __init__(self):
        self.gateway_url = os.getenv('OPENCLAW_GATEWAY_URL', 'http://localhost:18789')
        self.token = os.getenv('OPENCLAW_TOKEN', '')
        
        # Agent configurations
        self.agents = {
            'sarah': {
                'name': 'Sarah Chen',
                'role': 'Content Marketing Manager',
                'model': 'kimi-coding/k2p5',
                'personality': 'professional, creative, efficient',
                'capabilities': ['write_blog', 'social_media', 'email_campaigns', 'seo']
            },
            'john': {
                'name': 'John Miller',
                'role': 'Sales Development Rep',
                'model': 'kimi-coding/k2p5',
                'personality': 'persistent, friendly, goal-oriented',
                'capabilities': ['lead_qualification', 'demo_scheduling', 'proposals']
            },
            'mike': {
                'name': 'Mike Torres',
                'role': 'UI/UX Designer',
                'model': 'kimi-coding/k2p5',
                'personality': 'creative, detail-oriented, modern',
                'capabilities': ['logo_design', 'ui_mockups', 'brand_guidelines']
            }
        }
    
    def send_message_to_agent(self, agent_id, message, user_context=None):
        """Send message to OpenClaw agent and get response"""
        
        agent = self.agents.get(agent_id)
        if not agent:
            return {"error": "Agent not found"}
        
        # Build session key
        session_key = f"agent:genii:{agent_id}"
        
        # Build prompt with context
        prompt = f"""You are {agent['name']}, a {agent['role']}. 
Personality: {agent['personality']}

User message: {message}

Respond as {agent['name']}, maintaining your professional persona. Be helpful and actionable."""
        
        try:
            # Send to OpenClaw gateway
            response = requests.post(
                f"{self.gateway_url}/v1/sessions/{session_key}/messages",
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Content-Type": "application/json"
                },
                json={
                    "content": prompt,
                    "context": user_context or {}
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                # Fallback: simulate response
                return self._simulate_response(agent_id, message)
                
        except Exception as e:
            print(f"[OpenClaw] Error: {e}")
            return self._simulate_response(agent_id, message)
    
    def _simulate_response(self, agent_id, message):
        """Simulate agent response when OpenClaw is unavailable"""
        
        responses = {
            'sarah': """Hi! ??

Thanks for reaching out! I'd love to help with your content marketing needs.

To get started, could you tell me:
1. What's your business/industry?
2. What type of content do you need (blog, social, email)?
3. Any specific topics or goals?

I'll have a draft ready for you within 24 hours!

Best,
Sarah""",
            'john': """Hey there! 

Excited to help you grow your sales pipeline! ??

Quick questions to get started:
1. What does your company do?
2. Who's your ideal customer?
3. Do you have any leads I should follow up with?

I'll start qualifying prospects and setting up demos right away.

Talk soon,
John""",
            'mike': """Hello! ??

Ready to bring your brand vision to life!

Let's start with:
1. What's your company name and industry?
2. Do you have existing branding or starting fresh?
3. What design deliverables do you need (logo, UI, etc.)?

I'll create some initial concepts for you to review.

Cheers,
Mike"""
        }
        
        return {
            "content": responses.get(agent_id, "Hello! How can I help you today?"),
            "agent": agent_id,
            "simulated": True
        }
    
    def execute_task(self, agent_id, task_type, parameters):
        """Execute a task with an agent"""
        
        task_prompts = {
            'write_blog': f"Write a blog post about: {parameters.get('topic', 'general topic')}",
            'create_social': f"Create {parameters.get('count', 5)} social media posts",
            'qualify_lead': f"Qualify this lead: {parameters.get('lead_info', '')}",
            'design_logo': f"Create logo concepts for: {parameters.get('company', 'company')}"
        }
        
        prompt = task_prompts.get(task_type, f"Execute task: {task_type}")
        
        return self.send_message_to_agent(agent_id, prompt, parameters)
    
    def get_agent_status(self, agent_id):
        """Get agent availability status"""
        return {
            "agent_id": agent_id,
            "status": "available",
            "current_tasks": 0,
            "response_time": "< 5 minutes"
        }

# Global instance
openclaw_bridge = OpenClawBridge()

if __name__ == "__main__":
    # Test the bridge
    print("Testing OpenClaw Bridge...")
    response = openclaw_bridge.send_message_to_agent("sarah", "I need a blog post about AI")
    print(f"Response: {response.get('content', 'No response')[:100]}...")
